/**
 * ============================================================================
 * rounds.gs — 회차 드롭다운 운영 관리
 * ----------------------------------------------------------------------------
 * 운영 원칙:
 *  - 연초 일괄 등록 불가 → 운영 중 필요 시 추가
 *  - 과거 회차 제거하지 않음 (누적 유지 — 과거 회차 응답 보존)
 *  - 초기 "회차 등록 대기" 임시 선택지는 첫 실제 회차 추가 시 자동 제거
 * ============================================================================
 */

/**
 * 구글폼에 새 회차 선택지 추가
 * 용기/광역 담당자가 회차 시작 전 실행
 *
 * @param {string} formId - 구글폼 ID (마스터 로그에서 확인 가능)
 * @param {string} newRoundLabel - 추가할 회차 라벨
 *
 * @example
 *   addRoundToForm('FORM_ID', '1차 (2026-05-15)');
 *   addRoundToForm('FORM_ID', '북부권역 (거창·함양·합천·산청) - 2026-06-15');
 */
function addRoundToForm(formId, newRoundLabel) {
  const form = FormApp.openById(formId);
  const items = form.getItems(FormApp.ItemType.LIST);

  // 회차 문항 식별: 제목에 "이번 참여하신 회차" 포함
  const roundItem = items.find(item =>
    item.getTitle().indexOf('이번 참여하신 회차') !== -1
  );

  if (!roundItem) {
    throw new Error('회차 문항을 찾을 수 없습니다. 폼 ID 확인: ' + formId);
  }

  const listItem = roundItem.asListItem();
  const existingChoices = listItem.getChoices().map(c => c.getValue());

  // 이미 존재하는 회차인지 확인
  if (existingChoices.indexOf(newRoundLabel) !== -1) {
    Logger.log('이미 등록된 회차입니다: ' + newRoundLabel);
    return;
  }

  // "회차 등록 대기" 임시 옵션 제거
  const cleanedChoices = existingChoices.filter(
    c => c !== CONFIG.PLACEHOLDER_ROUND
  );
  cleanedChoices.push(newRoundLabel);

  listItem.setChoiceValues(cleanedChoices);
  Logger.log('회차 추가 완료: ' + newRoundLabel + ' (폼: ' + formId + ')');
}

/**
 * 여러 회차를 한번에 추가
 * @param {string} formId
 * @param {string[]} newRoundLabels
 */
function addRoundsToForm(formId, newRoundLabels) {
  const form = FormApp.openById(formId);
  const items = form.getItems(FormApp.ItemType.LIST);

  const roundItem = items.find(item =>
    item.getTitle().indexOf('이번 참여하신 회차') !== -1
  );

  if (!roundItem) {
    throw new Error('회차 문항을 찾을 수 없습니다. 폼 ID 확인: ' + formId);
  }

  const listItem = roundItem.asListItem();
  const existingChoices = listItem.getChoices().map(c => c.getValue());

  let cleanedChoices = existingChoices.filter(
    c => c !== CONFIG.PLACEHOLDER_ROUND
  );

  let added = 0;
  newRoundLabels.forEach(label => {
    if (cleanedChoices.indexOf(label) === -1) {
      cleanedChoices.push(label);
      added++;
    }
  });

  listItem.setChoiceValues(cleanedChoices);
  Logger.log(added + '개 회차 추가 완료 (폼: ' + formId + ')');
}

/**
 * 현재 등록된 회차 목록 조회
 * @param {string} formId
 * @returns {string[]}
 */
function listRoundsOfForm(formId) {
  const form = FormApp.openById(formId);
  const items = form.getItems(FormApp.ItemType.LIST);

  const roundItem = items.find(item =>
    item.getTitle().indexOf('이번 참여하신 회차') !== -1
  );

  if (!roundItem) {
    Logger.log('회차 문항 없음 (J16·J17 또는 회차 없는 폼): ' + formId);
    return [];
  }

  const choices = roundItem.asListItem().getChoices().map(c => c.getValue());
  Logger.log('현재 회차 ' + choices.length + '개: ' + JSON.stringify(choices));
  return choices;
}

// ---------------------------------------------------------------------------
// 사용 예시 (실행 시 FORM_ID를 실제 값으로 교체)
// ---------------------------------------------------------------------------

/**
 * 예시: J03 역량강화교육 전담 1차 회차 추가
 */
function example_addRound_J03_1st() {
  addRoundToForm('PUT_FORM_ID_HERE', '1차 (2026-05-15)');
}

/**
 * 예시: J07 실무협의회 권역별 4개 일괄 등록
 */
function example_addRounds_J07_allRegions() {
  addRoundsToForm('PUT_FORM_ID_HERE', [
    '북부권역 (거창·함양·합천·산청) - 2026-06-15',
    '서부권역 (진주·사천·고성·남해·하동) - 2026-07-10',
    '중부권역 (창원·함안·의령·창녕) - 2026-08-20',
    '동부권역 (김해·양산·밀양·통영·거제) - 2026-09-15'
  ]);
}
