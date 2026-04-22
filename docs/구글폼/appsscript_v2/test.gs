/**
 * ============================================================================
 * test.gs — 테스트 및 검증 함수
 * ----------------------------------------------------------------------------
 * 실제 생성 전 소규모 테스트용 함수 모음
 * ============================================================================
 */

/**
 * [테스트 1] config.gs 기관 목록 검증
 * 59개인지, 중복 없는지, 형식(시군구) 기관명 맞는지 확인
 */
function test_validateInstitutions() {
  const list = CONFIG.INSTITUTION_DROPDOWN;

  // 개수 검증
  if (list.length !== 59) {
    throw new Error('기관 개수 오류: 예상 59개, 실제 ' + list.length + '개');
  }
  Logger.log('✅ 기관 개수: 59개 일치');

  // 중복 검증
  const unique = {};
  list.forEach(name => {
    if (unique[name]) {
      throw new Error('중복된 기관명: ' + name);
    }
    unique[name] = true;
  });
  Logger.log('✅ 기관명 중복 없음');

  // 형식 검증 ([시군구] 기관명)
  const invalidFormat = [];
  list.forEach(name => {
    if (!/^\[[^\]]+\] .+/.test(name)) {
      invalidFormat.push(name);
    }
  });
  if (invalidFormat.length > 0) {
    throw new Error('형식 오류 기관: ' + invalidFormat.join(', '));
  }
  Logger.log('✅ 형식([시군구] 기관명) 모두 일치');

  // 시군구별 분포 확인
  const sigunguCounts = {};
  list.forEach(name => {
    const sg = name.match(/^\[([^\]]+)\]/)[1];
    sigunguCounts[sg] = (sigunguCounts[sg] || 0) + 1;
  });
  Logger.log('시군구별 기관 수:');
  Object.keys(sigunguCounts).sort().forEach(sg => {
    Logger.log('  ' + sg + ': ' + sigunguCounts[sg] + '개');
  });
  Logger.log('시군구 수: ' + Object.keys(sigunguCounts).length + ' (예상: 18개)');

  return true;
}

/**
 * [테스트 2] 단일 폼 생성 테스트 (J17 — 가장 단순한 회차 없는 사업)
 * 실제 생성되어 드라이브에 폼·스프레드시트가 만들어집니다.
 * 테스트 후 수동 삭제 필요.
 */
function test_createJ17Only() {
  const result = createJ17Form();
  Logger.log('테스트 폼 편집 URL: ' + result.form.getEditUrl());
  Logger.log('응답 스프레드시트 URL: ' + result.ss.getUrl());
  Logger.log('⚠ 테스트 완료 후 드라이브에서 수동 삭제하세요.');
  return result;
}

/**
 * [테스트 3] 회차 추가/조회 테스트
 * test_createJ17Only은 회차 문항이 없으므로, J03 생성 후 회차 추가 테스트
 * @param {string} [existingFormId] - 이미 생성된 J03 폼 ID (없으면 새로 생성)
 */
function test_addRoundToJ03(existingFormId) {
  let formId = existingFormId;
  if (!formId) {
    const result = createJ03Form();
    formId = result.form.getId();
    Logger.log('J03 테스트 폼 생성: ' + result.form.getEditUrl());
  }

  // 현재 회차 조회 (초기: "회차 등록 대기")
  Logger.log('--- 회차 추가 전 ---');
  listRoundsOfForm(formId);

  // 1차 추가
  addRoundToForm(formId, '[테스트] 1차 (2026-05-15)');
  Logger.log('--- 1차 추가 후 ---');
  listRoundsOfForm(formId);

  // 2차 추가
  addRoundToForm(formId, '[테스트] 2차 (2026-07-20)');
  Logger.log('--- 2차 추가 후 ---');
  listRoundsOfForm(formId);

  // 중복 추가 시도 (추가되지 않아야 함)
  addRoundToForm(formId, '[테스트] 1차 (2026-05-15)');
  Logger.log('--- 중복 추가 시도 후 ---');
  listRoundsOfForm(formId);

  Logger.log('⚠ 테스트 완료 후 드라이브에서 수동 삭제하세요. 폼 ID: ' + formId);
}

/**
 * [테스트 4] 전체 매핑 개수 검증
 * 각 폼의 헤더 매핑이 기대 문항 수와 일치하는지 (헤더 매핑 시트는 실제 생성 후에만 확인 가능)
 *
 * 기대 문항 수 (매핑 항목 수):
 *   S01: 61 (도입부 3 + 본섹션 58, 마무리 없음 - 실제 58 맞음. 현공1-2-3 포함 — 정확히 재계산하면 60)
 *   ※ 엄밀히 매핑 수 = 실제 응답 컬럼 수 (타임스탬프 제외)
 *
 * 실제 검증은 createAllForms 실행 후 마스터 로그 + 각 응답 스프레드시트의 header_mapping 시트에서 확인
 */
function test_expectedQuestionCounts() {
  // 참고: 실제 문항 수 카운트 (도입부 + 본섹션)
  const expected = {
    'S01': 61,  // 도입부 6 + 본섹션 55
    'S02': 64,  // 도입부 6 + 본섹션 56 + 마무리 2
    'J01': 13,  // 도입부 4 + 본섹션 9
    'J03': 11,
    'J04': 12,
    'J05': 12,
    'J06': 13,
    'J07': 11,
    'J08': 11,
    'J09': 13,
    'J10': 10,
    'J11': 11,
    'J12': 11,
    'J13': 11,
    'J14': 12,
    'J16': 10,  // 도입부 3 (회차 없음) + 본섹션 7
    'J17': 10   // 도입부 3 + 본섹션 7
  };

  Logger.log('기대 문항 수 (각 폼 생성 후 실제와 비교):');
  Object.keys(expected).forEach(code => {
    Logger.log('  ' + code + ': ' + expected[code] + '문항');
  });

  return expected;
}

/**
 * [테스트 5] 폼 문항 실제 개수 확인 (기존 폼 대상)
 * @param {string} formId
 */
function test_countFormItems(formId) {
  const form = FormApp.openById(formId);
  const items = form.getItems();
  const nonSectionItems = items.filter(item =>
    item.getType() !== FormApp.ItemType.SECTION_HEADER
  );
  Logger.log('폼 제목: ' + form.getTitle());
  Logger.log('전체 항목 수: ' + items.length);
  Logger.log('섹션 헤더 제외 문항 수: ' + nonSectionItems.length);
  return nonSectionItems.length;
}
