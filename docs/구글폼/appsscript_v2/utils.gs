/**
 * ============================================================================
 * utils.gs — 공통 유틸 함수
 * ============================================================================
 */

/**
 * 5점 척도(동의/찬성형) 문항 추가
 * ① 매우 그렇지 않다 ~ ⑤ 매우 그렇다
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 */
function addAgreeScale(form, title) {
  form.addScaleItem()
    .setTitle(title)
    .setBounds(CONFIG.SCALE_AGREE.min, CONFIG.SCALE_AGREE.max)
    .setLabels(CONFIG.SCALE_AGREE.labelMin, CONFIG.SCALE_AGREE.labelMax)
    .setRequired(true);
}

/**
 * 5점 척도(만족형) 문항 추가
 * ① 매우 불만족 ~ ⑤ 매우 만족
 * 구글폼은 setLabels에서 min-max 양끝만 표시하므로,
 * 분석 시 주의: 1=매우 불만족, 5=매우 만족 (설문지 정의와 반대일 수 있음)
 *
 * ※ 원 설문지는 "① 매우 만족 ~ ⑤ 매우 불만족" 순서이지만,
 *    구글폼 setScaleItem은 min이 낮은 값으로 고정되어 있어
 *    여기서는 1=불만족, 5=만족으로 통일.
 *    CSV 분석 시점에 매핑 일관성 유지 필요.
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 */
function addSatisfyScale(form, title) {
  form.addScaleItem()
    .setTitle(title)
    .setBounds(CONFIG.SCALE_SATISFY.min, CONFIG.SCALE_SATISFY.max)
    .setLabels(CONFIG.SCALE_SATISFY.labelMin, CONFIG.SCALE_SATISFY.labelMax)
    .setRequired(true);
}

/**
 * 단일선택 문항 추가
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 * @param {string[]} choices
 * @param {boolean} [hasOther=false] - 기타(직접 입력) 선택지 여부
 */
function addSingleChoice(form, title, choices, hasOther) {
  const item = form.addMultipleChoiceItem()
    .setTitle(title)
    .setRequired(true);

  if (hasOther) {
    const choiceObjs = choices.map(c => item.createChoice(c));
    item.setChoices(choiceObjs).showOtherOption(true);
  } else {
    item.setChoiceValues(choices);
  }
}

/**
 * 복수선택 문항 추가
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 * @param {string[]} choices
 * @param {boolean} [hasOther=false]
 */
function addCheckboxChoice(form, title, choices, hasOther) {
  const item = form.addCheckboxItem()
    .setTitle(title)
    .setRequired(true);

  if (hasOther) {
    const choiceObjs = choices.map(c => item.createChoice(c));
    item.setChoices(choiceObjs).showOtherOption(true);
  } else {
    item.setChoiceValues(choices);
  }
}

/**
 * 주관식(장문) 문항 추가
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 * @param {boolean} [required=false]
 */
function addLongText(form, title, required) {
  const item = form.addParagraphTextItem().setTitle(title);
  if (required === true) item.setRequired(true);
}

/**
 * 섹션 헤더 추가
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 * @param {string} [helpText]
 */
function addSection(form, title, helpText) {
  const section = form.addSectionHeaderItem().setTitle(title);
  if (helpText) section.setHelpText(helpText);
}

/**
 * 응답 스프레드시트 생성 및 연결
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} spreadsheetName
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function attachSpreadsheet(form, spreadsheetName) {
  const ss = SpreadsheetApp.create(spreadsheetName);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  return ss;
}

/**
 * 헤더 매핑 시트 생성 (응답 스프레드시트에 2번째 시트로 추가)
 * Claude Code의 CSV 파싱 로직이 설문 문항 타이틀을 내부 코드로 변환하는 데 사용
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {Array<{title:string, code:string}>} mappings
 */
function createHeaderMapping(ss, mappings) {
  // 이미 있으면 삭제 후 재생성
  const existing = ss.getSheetByName('header_mapping');
  if (existing) ss.deleteSheet(existing);

  const sheet = ss.insertSheet('header_mapping');
  sheet.appendRow(['구글폼 문항 타이틀', '내부 코드']);
  mappings.forEach(m => sheet.appendRow([m.title, m.code]));

  // 보기 편하게 열 너비 조정
  sheet.setColumnWidth(1, 500);
  sheet.setColumnWidth(2, 120);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
}

/**
 * 공통 도입부 매핑 객체 반환 (통합설문용)
 */
function getIntegratedIntroMappings() {
  return [
    { title: '귀하의 소속 기관은?', code: '기본-00' },
    { title: '귀하의 연령대는?', code: '기본-0' },
    { title: '귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? (타 기관 근무 경력 포함)', code: '기본-1' }
  ];
}

/**
 * 공통 도입부 매핑 객체 반환 (현장설문용)
 * @param {string} jCode
 */
function getFieldIntroMappings(jCode) {
  const maps = [
    { title: '귀하의 소속 기관은?', code: '도입-0' }
  ];
  if (!CONFIG.SURVEYS_WITHOUT_ROUND.includes(jCode)) {
    maps.push({ title: '이번 참여하신 회차/일정은?', code: '도입-0-a' });
  }
  maps.push(
    { title: '귀하의 연령대는?', code: '도입-1' },
    { title: '귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? (타 기관 근무 경력 포함)', code: '도입-2' }
  );
  return maps;
}

/**
 * 마스터 로그에 생성된 폼 정보 기록
 * @param {Object} createdForms - { S01: {form, ss}, ... }
 */
function logToMaster(createdForms) {
  const ss = SpreadsheetApp.create(CONFIG.MASTER_LOG_SPREADSHEET_NAME);
  const sheet = ss.getActiveSheet();
  sheet.setName('forms');
  sheet.appendRow([
    '코드', '폼 이름', '폼 ID', '편집 URL', '응답 URL', '응답 스프레드시트 ID', '생성 시각'
  ]);

  const now = new Date();
  Object.entries(createdForms).forEach(([code, data]) => {
    const form = data.form;
    const respSs = data.ss;
    sheet.appendRow([
      code,
      form.getTitle(),
      form.getId(),
      form.getEditUrl(),
      form.getPublishedUrl(),
      respSs ? respSs.getId() : '',
      now
    ]);
  });

  sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  sheet.autoResizeColumns(1, 7);

  Logger.log('마스터 로그 생성: ' + ss.getUrl());
  return ss;
}
