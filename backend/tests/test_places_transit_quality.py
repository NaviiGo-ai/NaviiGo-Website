import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
from fastapi import HTTPException
from routers import places
from services import destination_images, flight_search

def response(payload, status=200):
 return httpx.Response(status,json=payload,request=httpx.Request('GET','https://provider.invalid'))

@pytest.mark.asyncio
async def test_autocomplete_uses_configured_provider_and_alias(monkeypatch):
 monkeypatch.setattr(places,'GEOAPIFY_KEY','test-key')
 with patch('httpx.AsyncClient.get',new_callable=AsyncMock,return_value=response({'features':[{'properties':{'city':'Dehradun','state':'Uttarakhand','place_id':'real-id','lat':30.32,'lon':78.04}}]})) as get:
  data=await places.autocomplete('DDN')
  assert data['predictions'][0]['description']=='Dehradun'
  assert get.call_args.kwargs['params']['text']=='Dehradun'
  assert 'nominatim' not in get.call_args.args[0]

@pytest.mark.asyncio
async def test_provider_failure_is_not_a_successful_empty_result(monkeypatch):
 monkeypatch.setattr(places,'GEOAPIFY_KEY','test-key')
 with patch('httpx.AsyncClient.get',new_callable=AsyncMock,return_value=response({},403)):
  with pytest.raises(HTTPException) as error: await places.autocomplete('Delhi')
  assert error.value.status_code==503
  assert 'test-key' not in error.value.detail

@pytest.mark.asyncio
async def test_nearby_respects_radius_and_does_not_invent_prices(monkeypatch):
 monkeypatch.setattr(places,'GEOAPIFY_KEY','test-key')
 with patch('httpx.AsyncClient.get',new_callable=AsyncMock,return_value=response({'features':[{'properties':{'name':'Real attraction','place_id':'id','lat':32.24,'lon':77.18}}]})) as get:
  data=await places.nearby_places(32.24,77.18,'tourist_attraction',8000)
  assert get.call_args.kwargs['params']['filter']=='circle:77.18,32.24,8000'
  assert data['places'][0]['id']=='id'
  assert 'priceLevel' not in data['places'][0]

@pytest.mark.asyncio
async def test_details_uses_geoapify_when_google_rejects_key(monkeypatch):
 monkeypatch.setattr(places,'GOOGLE_PLACES_KEY','test-key')
 with patch('httpx.AsyncClient.post',new_callable=AsyncMock,return_value=response({},400)), patch.object(places,'_geoapify_places',new_callable=AsyncMock,return_value=[{'id':'real'}]):
  data=await places.place_details(30,78,'restaurant','',5000)
  assert data['results']==[{'id':'real'}]

@pytest.mark.asyncio
async def test_fares_deduplicate_and_cache_with_source(monkeypatch):
 monkeypatch.setattr(flight_search,'SERPAPI_KEY','test-key')
 flight_search._cache.clear()
 fare={'price':1234,'total_duration':80,'flights':[{'airline':'Airline','flight_number':'XX1','departure_airport':{'time':'10:00'},'arrival_airport':{'time':'11:20'}}]}
 with patch('httpx.AsyncClient.get',new_callable=AsyncMock,return_value=response({'best_flights':[fare], 'other_flights':[fare]})) as get:
  first=await flight_search.search_flights('DED','JAI','2099-01-01')
  second=await flight_search.search_flights('DED','JAI','2099-01-01')
  assert len(first['results'])==1
  assert first['results'][0]['price']==1234
  assert first['source']=='Google Flights via SerpApi'
  assert first==second and get.call_count==1

@pytest.mark.asyncio
async def test_images_require_reusable_license_and_known_host():
 destination_images._cache.clear()
 page=response({'query':{'pages':{'1':{'pageimage':'Real.jpg'}}}})
 info=response({'query':{'pages':{'2':{'imageinfo':[{'thumburl':'https://thumb.wikimedia.org/real.jpg','descriptionurl':'https://commons.wikimedia.org/wiki/File:Real.jpg','extmetadata':{'Artist':{'value':'<b>Author</b>'},'LicenseShortName':{'value':'CC BY-SA 4.0'}}}]}}}})
 with patch('httpx.AsyncClient.get',new_callable=AsyncMock,side_effect=[page,info]):
  image=await destination_images.destination_image('Real place')
  assert image['credit']=='Author' and image['license']=='CC BY-SA 4.0'

@pytest.mark.asyncio
async def test_google_photos_use_key_server_side_and_preserve_attribution(monkeypatch):
 monkeypatch.setenv('GOOGLE_PLACES_API_KEY','private-test-key')
 payload={'places':[{'id':'id','googleMapsUri':'https://maps.google.com/?cid=1','photos':[{'name':'places/id/photos/photo','authorAttributions':[{'displayName':'Photographer','uri':'https://maps.google.com/contrib/1'}]}]}]}
 with patch('httpx.AsyncClient.post',new_callable=AsyncMock,return_value=response(payload)) as post:
  image=await destination_images._google_photo('Kochi')
  assert image['source']=='Google Maps' and image['credit']=='Photographer'
  assert image['image'].startswith('/api/places/photo?name=places/id/photos/photo')
  assert 'private-test-key' not in str(image)
  assert post.call_args.kwargs['headers']['X-Goog-Api-Key']=='private-test-key'

@pytest.mark.asyncio
async def test_different_flight_routes_do_not_block_each_other(monkeypatch):
 monkeypatch.setattr(flight_search,'SERPAPI_KEY','test-key')
 flight_search._cache.clear()
 entered=[]
 release=asyncio.Event()
 async def provider(*args, **kwargs):
  entered.append(kwargs['params']['arrival_id'])
  if len(entered)==2: release.set()
  await asyncio.wait_for(release.wait(),timeout=1)
  return response({'best_flights':[]})
 with patch('httpx.AsyncClient.get',side_effect=provider):
  await asyncio.gather(flight_search.search_flights('DED','JAI','2099-02-01'),flight_search.search_flights('DED','DEL','2099-02-01'))
 assert set(entered)=={'JAI','DEL'}
