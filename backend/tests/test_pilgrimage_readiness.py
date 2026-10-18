"""Regressions from the real Ujjain pilgrimage acceptance failure."""
from unittest.mock import AsyncMock, patch
import pytest
from services import destination_cache as cache, geoapify_service as geo
from services.pilgrimage_intent import with_pilgrimage_anchor
from services.itinerary_model import generate_itinerary


def feature(name, categories=None):
    return {'properties': {'name': name, 'lat':23.18, 'lon':75.77,
            'categories':categories or ['religion','religion.place_of_worship.hinduism']}}


@pytest.mark.parametrize('name',['religious monuments','SH26B','NH 27','statue'])
def test_generic_labels_are_not_sightseeing_stops(name):
    assert geo.normalize_geoapify_place(feature(name),'highlight') is None


def test_address_is_not_an_attraction_name_and_faith_tags_reach_existing_scorer():
    assert geo.normalize_geoapify_place({'properties':{'address_line1':'SH26B','lat':23,'lon':75}},'highlight') is None
    result=geo.normalize_geoapify_place(feature('महाकालेश्वर मंदिर',['tourism.attraction','religion.place_of_worship.hinduism']))
    assert result['category']=='religious' and 'Spiritual' in result['tags']
    assert geo._place_name_key('काली मंदिर') != geo._place_name_key('कला मंदिर')
    assert geo.normalize_geoapify_place({'properties':{'address_line1':'Grand Road','lat':19.8,'lon':85.8}},'hotel') is None


def test_cache_enrichment_keeps_distinct_hindi_records_in_all_pools():
    old={key:[{'name':'काली मंदिर'}] for key in ('highlights','restaurants','hotels')}
    fresh={key:[{'name':'कला मंदिर'},{'name':'काली मंदिर'}] for key in old}
    result=cache._merge_destination_data(old,fresh)
    assert all(len(result[key])==2 for key in old)


@pytest.mark.asyncio
async def test_bare_dwarka_uses_gujarat_not_delhi():
    import httpx
    response=httpx.Response(200,json={'features':[]},request=httpx.Request('GET','https://api.geoapify.com'))
    with patch.object(geo,'is_geoapify_configured',return_value=True),patch('httpx.AsyncClient.get',AsyncMock(return_value=response)) as get:
        await geo.geocode_destination('Dwarka')
    assert get.call_args.kwargs['params']['text'].startswith('Dwarka, Gujarat')


@pytest.mark.asyncio
async def test_separate_faith_query_preserves_multiple_hindi_places():
    async def places(lat,lng,categories,**kwargs):
        if categories==['religion.place_of_worship']:
            return [feature('महाकालेश्वर मंदिर'),feature('बड़ा गणेश मंदिर'),feature('महाकालेश्वर मंदिर')]
        return [feature('Nearby Park',['leisure.park'])]
    with patch.object(geo,'geocode_destination',AsyncMock(return_value={'lat':23.18,'lng':75.77})),patch.object(geo,'fetch_places_candidates',side_effect=places):
        pool=await geo.build_destination_candidate_pool('Ujjain',purpose='spiritual')
    assert [p['name'] for p in pool['highlights']]==['महाकालेश्वर मंदिर','बड़ा गणेश मंदिर','Nearby Park']


@pytest.mark.asyncio
async def test_empty_faith_provider_does_not_return_unrelated_pilgrimage():
    async def places(lat,lng,categories,**kwargs):
        return [] if categories==['religion.place_of_worship'] else [feature('Park',['leisure.park'])]
    with patch.object(geo,'geocode_destination',AsyncMock(return_value={'lat':23,'lng':75})),patch.object(geo,'fetch_places_candidates',side_effect=places):
        assert await geo.build_destination_candidate_pool('Ujjain',purpose='spiritual') is None


@pytest.mark.asyncio
async def test_spiritual_cache_does_not_reuse_generic_pool():
    data={'highlights':[{'name':'Temple'}]*12,'restaurants':[{}]*8}
    with patch.object(cache,'_mem_get',return_value=data) as get:
        await cache.get_destination_data('Ujjain',purpose='spiritual',days=2)
    get.assert_called_once_with('ujjain_spiritual_v2')


@pytest.mark.parametrize('city,name',[
    ('Ujjain','।।श्री महाकालेश्वर ज्योतिर्लिंग।।'),
    ('Varanasi','Shri Kashi Vishwanath Temple'),
    ('Mathura','Shri Krishna Janmasthan Temple, Mathura'),
    ('Dwarka, Gujarat','Shree Dwarkadhish Temple'),
    ('Puri','Shree Jagannath Mandir Puri'),
])
def test_provider_backed_main_visit_is_reserved_without_inventing_a_place(city,name):
    ctx={'destName':city,'purpose':'spiritual','mustDo':[{'name':'Another stop','dayIndex':1}]}
    result=with_pilgrimage_anchor(ctx,[{'name':name,'category':'religious'}])
    assert result['mustDo'][-1]=={'name':name,'dayIndex':0}
    assert len(ctx['mustDo'])==1
    assert with_pilgrimage_anchor(ctx,[]) is ctx


def test_generation_keeps_main_visit_after_late_arrival_and_spatial_clustering():
    name='श्री महाकालेश्वर ज्योतिर्लिंग'
    highlights=[geo.normalize_geoapify_place(feature(f'Temple {i}')) for i in range(18)]
    highlights.append(geo.normalize_geoapify_place(feature(name)))
    ctx={'destName':'Ujjain','purpose':'spiritual','days':2,'budget':10000,'group':'solo','travelerType':'comfort','arrivalTime':'afternoon'}
    result=generate_itinerary(ctx,{'mapCenter':{'lat':23.18,'lng':75.77},'highlights':highlights,'restaurants':[],'hotels':[]})
    assert name in [a['name'] for a in result['dayPlans'][1]['activities']]
    excluded=generate_itinerary({**ctx,'visitedPlaces':[name]}, {'mapCenter':{'lat':23.18,'lng':75.77},'highlights':highlights,'restaurants':[],'hotels':[]})
    assert name not in [a['name'] for day in excluded['dayPlans'] for a in day['activities']]


def test_canonical_dwarka_visit_uses_next_full_day_and_preserves_user_pins():
    ctx={'destName':'Dwarka','purpose':'spiritual','days':3,'arrivalTime':'afternoon','mustDo':[]}
    candidates=[{'name':'Dwarkadish temple','category':'religious'},{'name':'Shree Dwarkadhish Temple','category':'religious'}]
    result=with_pilgrimage_anchor(ctx,candidates)
    assert result['mustDo']==[{'name':'Shree Dwarkadhish Temple','dayIndex':1}]
    explicit={**ctx,'mustDo':[{'name':'Shree Dwarkadhish Temple','dayIndex':2}]}
    assert with_pilgrimage_anchor(explicit,candidates) is explicit


def test_repair_does_not_move_afternoon_arrival_or_late_checkout_earlier():
    from services.feasibility_validator import repair_itinerary_feasibility
    plan={'dayPlans':[{'activities':[{'name':'Check-in at stay','type':'hotel','time':'02:00 PM','durationMins':45}]},
                      {'activities':[{'name':'Checkout from stay','type':'hotel','time':'11:00 AM','durationMins':30}]}]}
    result=repair_itinerary_feasibility(plan,{}, {})
    assert result['dayPlans'][0]['activities'][0]['time']=='02:00 PM'
    assert result['dayPlans'][1]['activities'][0]['time']=='11:00 AM'
