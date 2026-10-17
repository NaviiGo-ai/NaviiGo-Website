"""Reserve the requested pilgrimage's main visit from actual provider candidates.

Names identify intent, not live access, bookings, opening hours or endorsements.
No venue or coordinate is synthesized when the provider has no matching record.
"""
import re

ANCHORS = {
    'ujjain': ('mahakaleshwar', 'महाकालेश्वर'),
    'varanasi': ('kashivishwanath', 'काशीविश्वनाथ'),
    'mathura': ('krishnajanmasthan', 'krishnagarbh', 'कृष्णजन्मस्थान', 'कृष्णजन्मभूमि'),
    'dwarka': ('dwarkadhishtemple', 'dwarkadishtemple', 'द्वारकाधीशमंदिर'),
    'puri': ('jagannathtemple', 'jagannathmandir', 'जगन्नाथमंदिर'),
}


def _compact(value):
    # Preserve combining marks: dropping them changes Hindi words.
    return ''.join(c for c in str(value).casefold() if not c.isspace() and c not in '-_,.।/()')


def with_pilgrimage_anchor(ctx, candidates):
    """Use existing pinning; retain explicit user pins and exclusion rules."""
    if ctx.get('purpose') != 'spiritual':
        return ctx
    city = re.split(r'[,\s]+', str(ctx.get('destName') or '').strip().casefold())[0]
    aliases = ANCHORS.get(city)
    if not aliases:
        return ctx
    match = next((p for p in candidates if p.get('category') == 'religious'
                  and any(alias in _compact(p.get('name', '')) for alias in aliases)), None)
    if not match:
        return ctx
    pins = ctx.get('mustDo') or []
    if any(_compact(p.get('name', '')) == _compact(match['name']) for p in pins):
        return ctx
    return {**ctx, 'mustDo': [*pins, {'name': match['name'], 'dayIndex': 0}]}
