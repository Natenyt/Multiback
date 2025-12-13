"""
Utility functions for user-related operations.
"""

# Comprehensive lists of Uzbek male and female names
# These are common Uzbek names - the list can be extended

UZBEK_MALE_NAMES = {
    # Common Uzbek male names
    'alisher', 'aziz', 'bekzod', 'davron', 'eldor', 'farhod', 'gulom', 'hasan',
    'ibrohim', 'jamshid', 'kamol', 'laziz', 'murod', 'nodir', 'olim', 'pahlavon',
    'qodir', 'rustam', 'sardor', 'temur', 'ulugbek', 'vali', 'xurshid', 'yusuf',
    'zafar', 'akmal', 'bobur', 'dilshod', 'erkin', 'fazliddin', 'gafur', 'husan',
    'islom', 'javohir', 'komil', 'lutfulla', 'muhammad', 'nuriddin', 'odil', 'parviz',
    'qobil', 'ravshan', 'suhrob', 'toshmat', 'umid', 'vohid', 'xayrulla', 'yasin',
    'zokir', 'abdulla', 'bahodir', 'davlat', 'eldor', 'firdavs', 'gayrat', 'hojiakbar',
    'islomjon', 'jakhongir', 'khalil', 'lochin', 'mansur', 'nazir', 'ozod', 'pirmuhammad',
    'qahramon', 'ramazon', 'sherzod', 'tohir', 'umar', 'vokhid', 'xasan', 'yuldosh',
    'zafar', 'akbar', 'botir', 'dilshod', 'erkin', 'fayzulla', 'gulomjon', 'hasanali',
    'ibodulla', 'jamshed', 'kamil', 'lazizbek', 'murodjon', 'nurillo', 'olimjon', 'pahlavonbek',
    'qodirjon', 'rustamjon', 'sardorjon', 'temurjon', 'ulugbekjon', 'valijon', 'xurshidjon', 'yusufjon',
}

UZBEK_FEMALE_NAMES = {
    # Common Uzbek female names
    'aziza', 'bahriniso', 'dilnoza', 'eldora', 'farangiz', 'gulnora', 'hafiza', 'ilona',
    'jamila', 'kamola', 'lola', 'madina', 'nargiza', 'ozoda', 'parvina', 'qizlar',
    'ravshana', 'sabina', 'tahmina', 'umida', 'vazira', 'xadicha', 'yulduz', 'zaynab',
    'aisha', 'bibi', 'dilbar', 'elvira', 'feruza', 'gulchehra', 'hafsa', 'ilhom',
    'jamilya', 'kamila', 'laylo', 'mavluda', 'nazira', 'ozoda', 'parizoda', 'qumri',
    'ravshan', 'sabrina', 'tanzila', 'umida', 'vazira', 'xadicha', 'yulduz', 'zaynab',
    'aigul', 'bahriniso', 'dilafruz', 'elvira', 'feruza', 'gulchehra', 'hafiza', 'ilona',
    'jamila', 'kamola', 'laylo', 'mavluda', 'nazira', 'ozoda', 'parizoda', 'qumri',
    'ravshan', 'sabrina', 'tanzila', 'umida', 'vazira', 'xadicha', 'yulduz', 'zaynab',
    'aisha', 'bibi', 'dilbar', 'elvira', 'feruza', 'gulchehra', 'hafsa', 'ilhom',
    'jamilya', 'kamila', 'laylo', 'mavluda', 'nazira', 'ozoda', 'parizoda', 'qumri',
    'ravshan', 'sabrina', 'tanzila', 'umida', 'vazira', 'xadicha', 'yulduz', 'zaynab',
    'aigul', 'bahriniso', 'dilafruz', 'elvira', 'feruza', 'gulchehra', 'hafiza', 'ilona',
    'jamila', 'kamola', 'laylo', 'mavluda', 'nazira', 'ozoda', 'parizoda', 'qumri',
}


def detect_gender_from_name(full_name: str) -> str:
    """
    Detect gender from Uzbek full name by checking the first name against
    lists of common Uzbek male and female names.
    
    Args:
        full_name: Full name string (e.g., "Alisher Usmanov")
        
    Returns:
        'M' for Male, 'F' for Female, 'U' for Unknown
    """
    if not full_name:
        return 'U'
    
    # Extract first name (first word)
    first_name = full_name.strip().split()[0].lower() if full_name.strip() else ''
    
    if not first_name:
        return 'U'
    
    # Check against male names
    if first_name in UZBEK_MALE_NAMES:
        return 'M'
    
    # Check against female names
    if first_name in UZBEK_FEMALE_NAMES:
        return 'F'
    
    # Unknown if not found in either list
    return 'U'







