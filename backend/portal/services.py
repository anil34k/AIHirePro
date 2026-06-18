import json
import re
import logging
import requests

logger = logging.getLogger(__name__)

LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql'

DIFFICULTY_MAP = {'EASY': 'EASY', 'MEDIUM': 'MEDIUM', 'HARD': 'HARD'}

CATEGORY_MAP = {
    'array': 'ARRAYS', 'string': 'STRINGS', 'linked-list': 'LINKED_LISTS',
    'tree': 'TREES', 'graph': 'GRAPHS', 'dynamic-programming': 'DYNAMIC_PROGRAMMING',
    'recursion': 'RECURSION', 'sorting': 'SORTING', 'binary-search': 'SEARCHING',
    'sql': 'SQL', 'database': 'SQL', 'hash-table': 'ARRAYS',
    'stack': 'ARRAYS', 'queue': 'ARRAYS', 'heap': 'SORTING',
    'two-pointers': 'ARRAYS', 'sliding-window': 'ARRAYS',
    'divide-and-conquer': 'RECURSION', 'greedy': 'OTHER',
    'math': 'OTHER', 'geometry': 'OTHER', 'simulation': 'OTHER',
}

QUESTION_DATA_QUERY = """
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    difficulty
    content
    topicTags { name slug }
    sampleTestCase
    exampleTestcases
    metaData
    codeSnippets { lang langSlug code }
  }
}
"""


def extract_slug(url):
    slug_match = re.search(r'leetcode\.com/problems/([^/?#]+)', url)
    if slug_match:
        return slug_match.group(1)
    return None


def parse_leetcode_url(url):
    logger.info(f"[LEETCODE IMPORT] Attempting GraphQL import for: {url}")

    slug = extract_slug(url)
    if not slug:
        logger.warning(f"[LEETCODE IMPORT] Could not extract slug from URL: {url}")
        return _graphql_failed_response(url, 'Invalid LeetCode URL format.')

    try:
        resp = requests.post(
            LEETCODE_GRAPHQL_URL,
            json={'query': QUESTION_DATA_QUERY, 'variables': {'titleSlug': slug}},
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://leetcode.com',
                'Referer': f'https://leetcode.com/problems/{slug}/',
            },
            timeout=15,
        )
        logger.info(f"[LEETCODE IMPORT] GraphQL response status: {resp.status_code}")

        if resp.status_code != 200:
            logger.warning(f"[LEETCODE IMPORT] GraphQL returned {resp.status_code}: {resp.text[:500]}")
            return _graphql_failed_response(url, f'LeetCode API returned status {resp.status_code}.')

        payload = resp.json()
        question = payload.get('data', {}).get('question')

        if not question:
            errors = payload.get('errors', [])
            err_msg = errors[0].get('message', 'Unknown GraphQL error') if errors else 'Problem not found on LeetCode'
            logger.warning(f"[LEETCODE IMPORT] GraphQL returned no data: {payload.get('errors', 'No errors field')}")
            return _graphql_failed_response(url, err_msg)

        logger.info(f"[LEETCODE IMPORT] GraphQL success: {question.get('title')} ({question.get('difficulty')})")
        return _transform_graphql_result(question, url)

    except requests.Timeout:
        logger.error(f"[LEETCODE IMPORT] GraphQL request timed out for {url}")
        return _graphql_failed_response(url, 'LeetCode API request timed out.')
    except requests.ConnectionError as e:
        logger.error(f"[LEETCODE IMPORT] Connection error for {url}: {e}")
        return _graphql_failed_response(url, 'Could not connect to LeetCode API.')
    except Exception as e:
        logger.error(f"[LEETCODE IMPORT] Unexpected error for {url}: {e}", exc_info=True)
        return _graphql_failed_response(url, str(e))


def _transform_graphql_result(question, url):
    title = question.get('title', '')
    if not title:
        fallback = url.rstrip('/').split('/')[-1].replace('-', ' ').title()
        title = fallback

    difficulty = question.get('difficulty', 'MEDIUM')
    if difficulty not in DIFFICULTY_MAP:
        difficulty = 'MEDIUM'

    content = question.get('content', '')
    plain_text = re.sub(r'<[^>]+>', '', content) if content else ''
    plain_text = plain_text[:3000] if plain_text else 'No description available.'

    tags = []
    for tag in question.get('topicTags', []):
        name = tag.get('name', '').lower()
        tags.append(tag.get('name', ''))
    category = 'OTHER'
    for tag_name in tags:
        tag_lower = tag_name.lower()
        if tag_lower in CATEGORY_MAP:
            category = CATEGORY_MAP[tag_lower]
            break

    function_signature = ''
    code_snippets = question.get('codeSnippets', [])
    for snippet in code_snippets:
        if snippet.get('langSlug') == 'python':
            code = snippet.get('code', '')
            sig_line = code.split('\n')[0] if code else ''
            function_signature = sig_line.strip()[:200]
            break

    sample_input = question.get('sampleTestCase', '')
    example_testcases_raw = question.get('exampleTestcases', '')

    visible_test_cases = []
    if example_testcases_raw:
        lines = [l.strip() for l in example_testcases_raw.split('\n') if l.strip()]
        for i in range(0, len(lines) - 1, 2):
            inp = lines[i]
            out = lines[i + 1]
            visible_test_cases.append({'input': inp, 'output': out})
            if len(visible_test_cases) >= 2:
                break

    if not visible_test_cases and sample_input:
        output = question.get('metaData', '{}')
        try:
            meta = json.loads(output)
            sample_output = meta.get('sample', '')
        except Exception:
            sample_output = ''
        visible_test_cases.append({'input': sample_input, 'output': sample_output or 'See description'})

    starter_codes = _build_starter_codes(code_snippets)

    result = {
        'title': title,
        'description': plain_text,
        'difficulty': difficulty,
        'category': category,
        'function_signature': function_signature,
        'starter_code_python': starter_codes.get('python', '# Write your solution here\n'),
        'starter_code_javascript': starter_codes.get('javascript', '// Write your solution here\n'),
        'starter_code_java': starter_codes.get('java', '// Write your solution here\n'),
        'starter_code_cpp': starter_codes.get('cpp', '// Write your solution here\n'),
        'starter_code_csharp': starter_codes.get('csharp', '// Write your solution here\n'),
        'visible_test_cases': visible_test_cases,
        'sample_input': sample_input,
        'sample_output': visible_test_cases[0]['output'] if visible_test_cases else '',
        'source_url': url,
        'graphql_imported': True,
    }
    logger.info(f"[LEETCODE IMPORT] Successfully imported: {title} ({difficulty})")
    return result


def _build_starter_codes(snippets):
    mapping = {
        'python': 'python', 'python3': 'python',
        'javascript': 'javascript', 'typescript': 'javascript',
        'java': 'java', 'cpp': 'cpp', 'csharp': 'csharp',
    }
    result = {}
    for snippet in snippets:
        lang_slug = snippet.get('langSlug', '')
        code = snippet.get('code', '')
        if lang_slug in mapping:
            target = mapping[lang_slug]
            if target not in result:
                result[target] = code
    return result


def _graphql_failed_response(url, reason):
    logger.warning(f"[LEETCODE IMPORT] GraphQL failed for {url}: {reason}")
    return {
        'graphql_failed': True,
        'error': f'Automatic import unavailable for this problem. {reason} Please use Manual Import.',
        'source_url': url,
        'suggested_title': url.rstrip('/').split('/')[-1].replace('-', ' ').title(),
    }
