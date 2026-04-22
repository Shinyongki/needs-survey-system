/**
 * ============================================================================
 * introSection.gs — 도입부 섹션 생성
 * ----------------------------------------------------------------------------
 * 통합설문(S01·S02): 기본-00 기관 / 기본-0 연령 / 기본-1 경력 + 현공-1·2·3
 * 현장설문 회차 있음(12종): 도입-0 기관 / 도입-0-a 회차 / 도입-1 연령 / 도입-2 경력
 * 현장설문 회차 없음(J16·J17): 도입-0 기관 / 도입-1 연령 / 도입-2 경력
 * ============================================================================
 */

/**
 * 통합설문 공통 도입부 3문항 추가 (기관·연령·경력)
 * 현공-1·2·3은 S01/S02 각 파일에서 별도 추가
 * @param {GoogleAppsScript.Forms.Form} form
 */
function addIntegratedSurveyBaseIntro(form) {
  // 기본-00: 소속 기관
  form.addListItem()
    .setTitle('귀하의 소속 기관은?')
    .setHelpText('시군구 가나다순으로 정렬되어 있습니다. 해당 기관을 선택해주세요.')
    .setChoiceValues(CONFIG.INSTITUTION_DROPDOWN)
    .setRequired(true);

  // 기본-0: 연령대
  form.addMultipleChoiceItem()
    .setTitle('귀하의 연령대는?')
    .setChoiceValues(CONFIG.AGE_GROUPS)
    .setRequired(true);

  // 기본-1: 경력
  form.addMultipleChoiceItem()
    .setTitle('귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? (타 기관 근무 경력 포함)')
    .setChoiceValues(CONFIG.CAREERS)
    .setRequired(true);
}

/**
 * 현장설문 도입부 추가 (회차 유무에 따라 3 또는 4문항)
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} jCode - J01, J03, ..., J17
 * @param {string[]} [rounds] - 회차 드롭다운 선택지 (J16·J17은 무시됨)
 */
function addFieldSurveyIntro(form, jCode, rounds) {
  // 도입-0: 소속 기관
  form.addListItem()
    .setTitle('귀하의 소속 기관은?')
    .setHelpText('시군구 가나다순으로 정렬되어 있습니다. 해당 기관을 선택해주세요.')
    .setChoiceValues(CONFIG.INSTITUTION_DROPDOWN)
    .setRequired(true);

  // 도입-0-a: 회차 (J16·J17 제외)
  if (!CONFIG.SURVEYS_WITHOUT_ROUND.includes(jCode)) {
    const roundChoices = (rounds && rounds.length > 0)
      ? rounds
      : [CONFIG.PLACEHOLDER_ROUND];
    const helpText = (rounds && rounds.length > 0)
      ? '이번 참여하신 회차/일정을 선택해주세요.'
      : '회차/일정이 아직 등록되지 않았습니다. 광역에 문의 후 응답해주세요.';

    form.addListItem()
      .setTitle('이번 참여하신 회차/일정은?')
      .setHelpText(helpText)
      .setChoiceValues(roundChoices)
      .setRequired(true);
  }

  // 도입-1: 연령대
  form.addMultipleChoiceItem()
    .setTitle('귀하의 연령대는?')
    .setChoiceValues(CONFIG.AGE_GROUPS)
    .setRequired(true);

  // 도입-2: 경력
  form.addMultipleChoiceItem()
    .setTitle('귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? (타 기관 근무 경력 포함)')
    .setChoiceValues(CONFIG.CAREERS)
    .setRequired(true);
}
