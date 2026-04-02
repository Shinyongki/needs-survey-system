/**
 * 경상남도사회서비스원 노인맞춤돌봄서비스 광역지원기관
 * 현장설문 16종 생성 스크립트 v2.0 (2026)
 * - 공통 문항 "사업" → J코드별 대체 용어 적용
 * - 공통-4 "업무에" → J코드별 목적에 맞는 표현 적용
 *
 * [실행 방법]
 * 1. 기존 16종 폼 Google Drive에서 삭제
 * 2. 이 스크립트를 Apps Script에 붙여넣기
 * 3. createAllJForms() 실행
 * 4. 로그에서 16개 폼 URL 확인
 */

// ============================================================
// SECTION 1: 유틸리티 함수
// ============================================================

function qn(n) {
  return 'Q' + String(n).padStart(2, '0') + '. ';
}

function addMC(form, qNum, text, choices, helpText) {
  const item = form.addMultipleChoiceItem();
  item.setTitle(qn(qNum) + text);
  item.setChoices(choices.map(c => item.createChoice(c)));
  item.setRequired(true);
  if (helpText) item.setHelpText(helpText);
  return item;
}

function addCB(form, qNum, text, choices, max) {
  const item = form.addCheckboxItem();
  item.setTitle(qn(qNum) + text);
  item.setChoices(choices.map(c => item.createChoice(c)));
  item.setRequired(true);
  if (max) {
    item.setValidation(
      FormApp.createCheckboxValidation().requireSelectAtMost(max).build()
    );
    item.setHelpText('최대 ' + max + '개 선택');
  }
  return item;
}

function addScale(form, qNum, text, choices) {
  const item = form.addMultipleChoiceItem();
  item.setTitle(qn(qNum) + text);
  item.setChoices(choices.map(c => item.createChoice(c)));
  item.setRequired(true);
  return item;
}

function addPara(form, qNum, text) {
  const item = form.addParagraphTextItem();
  item.setTitle(qn(qNum) + text);
  item.setRequired(false);
  return item;
}

function addPage(form, title, desc) {
  const item = form.addPageBreakItem();
  item.setTitle(title);
  if (desc) item.setHelpText(desc);
  return item;
}

function setupForm(form, title, desc) {
  form.setTitle(title);
  form.setDescription(desc || '');
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(false);
  form.setCollectEmail(false);
  form.setConfirmationMessage('응답해 주셔서 감사합니다.');
  return form;
}

// ============================================================
// SECTION 2: 현장설문 공통 도입부 (Q01~Q03)
// ============================================================

function addJIntro(form) {
  addMC(form, 1, '귀하의 연령대는?',
    ['① 20대', '② 30대', '③ 40대', '④ 50대', '⑤ 60대 이상']);
  addMC(form, 2, '귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? (타 기관 근무 경력 포함)',
    ['① 1년 미만', '② 1~3년', '③ 3~5년', '④ 5년 이상']);
  addMC(form, 3, '귀하의 소속 권역은?',
    ['① 북부(거창·함양·합천·산청)', '② 서부(진주·사천·고성·남해·하동)',
     '③ 중부(창원·함안·의령·창녕)', '④ 동부(김해·양산·밀양·통영·거제)']);
}

// ============================================================
// SECTION 3: 현장설문 공통 만족도 문항 (Q04~Q08)
// term: J코드별 대체 용어 (예: '점검', '교육', '실무협의회')
// q4Text: 공통-4 전체 문장 (J코드별 목적에 맞게 커스텀)
// ============================================================

function addJCommon(form, term, q4Text) {
  const suf5   = ['① 매우 충분', '② 충분', '③ 보통', '④ 부족', '⑤ 매우 부족'];
  const scale5 = ['① 매우 그렇다', '② 그렇다', '③ 보통', '④ 그렇지 않다', '⑤ 매우 그렇지 않다'];
  const sat5   = ['① 매우 만족', '② 만족', '③ 보통', '④ 불만족', '⑤ 매우 불만족'];

  addScale(form, 4, '이번 ' + term + '에 대한 사전 안내가 충분하였습니까?', suf5);
  addScale(form, 5, term + ' 진행 과정이 체계적으로 운영되었습니까?', scale5);
  addScale(form, 6, '담당자(광역지원기관)의 전문성과 태도가 적절하였습니까?', scale5);
  addScale(form, 7, q4Text, scale5);
  addScale(form, 8, '이번 ' + term + '에 대한 종합 만족도는 어느 정도입니까?', sat5);
}

// ============================================================
// SECTION 4: J코드별 설문 스펙 정의
// term: 공통-1·2·5에 사용할 대체 용어
// q4: 공통-4 전체 문장
// specialized: 특화 문항 (Q09~)
// ============================================================

const SCALE5 = ['① 매우 그렇다', '② 그렇다', '③ 보통', '④ 그렇지 않다', '⑤ 매우 그렇지 않다'];

const J_SPECS = {

  J01: {
    code: 'J01', title: '수행기관 모니터링·점검', target: '전담사회복지사',
    term: '점검',
    q4: '이번 점검이 기관 운영 개선에 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 점검에서 다룬 항목이 현장 운영 실태를 반영하였습니까?' },
      { type: 'scale', text: '이번 점검에서 광역담당자의 현장 피드백이 구체적이고 도움이 되었습니까?' },
      { type: 'scale', text: '점검 지적사항에 대해 스스로 개선 방향을 파악할 수 있었습니까?' },
      { type: 'scale', text: '이번 점검 방식(현장 방문·서면·화상)이 기관 상황에 적합하였습니까?' },
      { type: 'para',  text: '이번 모니터링·점검 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J03: {
    code: 'J03', title: '역량강화교육', target: '전담사회복지사',
    term: '교육',
    q4: '이번 교육이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 교육 주제가 현장 업무와 관련성이 높았습니까?' },
      { type: 'scale', text: '강사의 전문성과 강의 전달력이 적절하였습니까?' },
      { type: 'scale', text: '교육 운영 방식(집합·온라인 등)이 참여하기 편리하였습니까?' },
      { type: 'scale', text: '이번 교육에서 배운 내용을 현장에 적용할 수 있겠습니까?' },
      { type: 'para',  text: '이번 교육 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J04: {
    code: 'J04', title: '역량강화교육', target: '생활지원사',
    term: '교육',
    q4: '이번 교육이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 교육 주제가 현장 업무와 관련성이 높았습니까?' },
      { type: 'scale', text: '강사의 전문성과 강의 전달력이 적절하였습니까?' },
      { type: 'scale', text: '교육 운영 방식이 참여하기 편리하였습니까?' },
      { type: 'scale', text: '이번 교육에서 배운 내용을 현장에 적용할 수 있겠습니까?' },
      { type: 'mc',    text: '다음 교육에서 가장 필요한 주제는?', isNeeds: true,
        choices: ['① 이용자 안전사고 대응', '② 서비스 제공 실무',
                  '③ 감정노동·폭언 대처', '④ ICT 기기 활용', '⑤ 치매·노인 질환 이해'] },
      { type: 'para',  text: '이번 교육 관련 바라는 점을 적어주세요.' },
    ]
  },

  J05: {
    code: 'J05', title: '심리지원교육', target: '전담사회복지사',
    term: '교육',
    q4: '이번 교육이 소진 회복에 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 심리지원 프로그램이 소진 회복에 실질적으로 도움이 되었습니까?' },
      { type: 'scale', text: '프로그램 운영 방식이 참여하기 편리하였습니까?' },
      { type: 'scale', text: '이번 프로그램이 업무 중 감정노동·스트레스 관리에 도움이 되었습니까?' },
      { type: 'scale', text: '이번 프로그램에서 배운 내용을 현장에 적용할 수 있겠습니까?' },
      { type: 'para',  text: '이번 심리지원교육 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J06: {
    code: 'J06', title: '심리지원교육', target: '생활지원사',
    term: '교육',
    q4: '이번 교육이 소진 회복에 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 심리지원 프로그램이 정서적 회복에 도움이 되었습니까?' },
      { type: 'scale', text: '프로그램 운영 방식이 참여하기 편리하였습니까?' },
      { type: 'scale', text: '이번 프로그램이 업무 중 감정노동·스트레스 관리에 도움이 되었습니까?' },
      { type: 'scale', text: '이번 프로그램에서 배운 내용을 일상 업무에 적용할 수 있겠습니까?' },
      { type: 'mc',    text: '다음 심리지원 프로그램에서 가장 필요한 것은?', isNeeds: true,
        choices: ['① 소진 예방 및 자기돌봄', '② 감정노동 대처 기술',
                  '③ 동료 지지 모임', '④ 전문 심리상담 연계', '⑤ 여가·힐링 프로그램'] },
      { type: 'para',  text: '이번 심리지원교육 관련 바라는 점을 적어주세요.' },
    ]
  },

  J07: {
    code: 'J07', title: '실무협의회', target: '전담사회복지사',
    term: '실무협의회',
    q4: '이번 실무협의회가 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 실무협의회 주제가 현장 업무 현안과 관련성이 높았습니까?' },
      { type: 'scale', text: '사전에 요청한 주제가 충분히 다루어졌습니까?' },
      { type: 'scale', text: '진행 방식(대면·비대면)과 개최 지역·시간대가 참여하기 편리하였습니까?' },
      { type: 'scale', text: '수행기관 간 사례 공유 시간이 충분하였습니까?' },
      { type: 'para',  text: '이번 실무협의회 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J08: {
    code: 'J08', title: '컨설팅 지원', target: '전담사회복지사',
    term: '컨설팅',
    q4: '이번 컨설팅이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '컨설팅 요청 후 응대 속도가 적절하였습니까?' },
      { type: 'scale', text: '컨설팅 내용이 실제 문제 해결에 도움이 되었습니까?' },
      { type: 'mc',    text: '이번에 지원받은 컨설팅 분야는?',
        choices: ['① 서비스 제공 실무', '② 행정·서류 처리', '③ 이용자 안전사고 대응',
                  '④ 특화·위기사례 관리', '⑤ 퇴원환자 서비스 실무', '⑥ 노무·인사'] },
      { type: 'scale', text: '컨설팅 후 문제가 실질적으로 해결되었습니까?' },
      { type: 'para',  text: '이번 컨설팅 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J09: {
    code: 'J09', title: '특화지원서비스·위기사례 연계', target: '전담사회복지사',
    term: '지원',
    q4: '이번 지원이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '슈퍼비전 내용이 사례 관리에 실질적으로 도움이 되었습니까?' },
      { type: 'scale', text: '위기사례 발생 시 광역지원기관의 즉각 대응이 충분하였습니까?' },
      { type: 'scale', text: '연계 기관 정보 제공이 충분하였습니까?' },
      { type: 'scale', text: '이번 지원 이후 사례 관리 방향을 스스로 결정할 수 있겠습니까?' },
      { type: 'para',  text: '이번 지원 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J10: {
    code: 'J10', title: '퇴원환자 단기집중서비스', target: '전담사회복지사',
    term: '서비스 지원',
    q4: '이번 서비스 지원이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 퇴원환자 서비스에서 광역 담당자와 소통이 원활하였습니까?' },
      { type: 'scale', text: '실무 매뉴얼·가이드가 현장 운영에 도움이 되었습니까?' },
      { type: 'scale', text: '광역의 슈퍼비전·사례 공유가 서비스 운영에 도움이 되었습니까?' },
      { type: 'scale', text: '이번 지원 이후 퇴원환자 서비스를 독립적으로 운영할 수 있겠습니까?' },
      { type: 'para',  text: '이번 퇴원환자 단기집중서비스 관련 바라는 점을 적어주세요.' },
    ]
  },

  J11: {
    code: 'J11', title: '노무 상담 지원', target: '전담사회복지사',
    term: '노무 상담',
    q4: '이번 노무 상담이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '노무 상담 요청 후 응대 속도가 적절하였습니까?' },
      { type: 'scale', text: '상담 내용이 실제 노무 문제 해결에 도움이 되었습니까?' },
      { type: 'mc',    text: '이번에 상담받은 노무 유형은?',
        choices: ['① 임금·수당 산정', '② 휴가·휴직 처리', '③ 근로시간 관리',
                  '④ 징계·해고 절차', '⑤ 폭언·폭행 피해 대응', '⑥ 계약서·취업규칙'] },
      { type: 'scale', text: '노무 상담 후 해당 문제가 실질적으로 해결되었습니까?' },
      { type: 'para',  text: '이번 노무 상담 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J12: {
    code: 'J12', title: 'ICT 지원사업', target: '전담사회복지사',
    term: 'ICT 지원',
    q4: '이번 ICT 지원이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '광역이 제공한 ICT 관련 정보·안내 자료가 현장 운영에 도움이 되었습니까?' },
      { type: 'scale', text: '돌봄로봇 배포·관리 관련 광역 지원이 충분하였습니까?' },
      { type: 'scale', text: 'ICT 기기 관련 문의 시 광역 담당자의 응대가 신속하였습니까?' },
      { type: 'scale', text: 'ICT 기기 관련 이용자 교육 자료·가이드가 충분하였습니까?' },
      { type: 'para',  text: '이번 ICT 지원 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J13: {
    code: 'J13', title: 'THE(더) 나눔사업', target: '전담사회복지사',
    term: '나눔사업',
    q4: '이번 나눔사업이 이용자 서비스 제공에 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '물품 배부 일정·신청 절차 안내가 충분하였습니까?' },
      { type: 'scale', text: '물품 배부 집결 장소·시간이 참여하기 편리하였습니까?' },
      { type: 'scale', text: '배부된 물품이 이용자 필요에 적합하였습니까?' },
      { type: 'scale', text: '나눔사업 진행 과정에서 광역 담당자와 소통이 원활하였습니까?' },
      { type: 'para',  text: '이번 나눔사업 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J14: {
    code: 'J14', title: '안심 돌봄 캠페인', target: '전담사회복지사',
    term: '캠페인',
    q4: '이번 캠페인이 서비스 홍보에 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '이번 캠페인 홍보물이 서비스 홍보에 실질적으로 도움이 되었습니까?' },
      { type: 'scale', text: '이번 캠페인 진행 방식(일정·장소·방법)이 참여하기 편리하였습니까?' },
      { type: 'mc',    text: '이번 캠페인에서 가장 효과적이었던 홍보 채널은?',
        choices: ['① SNS(카카오·인스타그램 등)', '② 지역 언론·신문', '③ 현수막·포스터',
                  '④ 지자체 협력 홍보', '⑤ 주민센터·복지관 배포'] },
      { type: 'scale', text: '이번 캠페인이 이용자·지역사회의 서비스 인식 제고에 효과적이었습니까?' },
      { type: 'para',  text: '이번 캠페인 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J15: {
    code: 'J15', title: '홍보사업', target: '전담사회복지사',
    term: '홍보사업',
    q4: '이번 홍보사업이 서비스 홍보에 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '광역이 제공한 홍보물·콘텐츠 품질이 적절하였습니까?' },
      { type: 'scale', text: '홍보 자료가 이용자·지역사회 인식 제고에 도움이 되었습니까?' },
      { type: 'scale', text: '광역이 제공한 홍보물·콘텐츠가 현장에서 활용하기 편리하였습니까?' },
      { type: 'scale', text: '이번 홍보사업 진행 과정에서 광역 담당자와 소통이 원활하였습니까?' },
      { type: 'para',  text: '이번 홍보사업 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J16: {
    code: 'J16', title: '유공자 표창', target: '전담사회복지사',
    term: '표창',
    q4: '이번 표창이 종사자 사기 진작에 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '추천 기준 및 절차 안내가 충분하였습니까?' },
      { type: 'scale', text: '공적조서 작성 가이드가 실무에 도움이 되었습니까?' },
      { type: 'scale', text: '추천 절차 진행 과정에서 광역 담당자의 응대가 신속하였습니까?' },
      { type: 'scale', text: '이번 추천 경험이 향후 유공자 발굴·추천에 도움이 되겠습니까?' },
      { type: 'para',  text: '이번 표창 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },

  J17: {
    code: 'J17', title: '종사자 지원사업', target: '전담사회복지사',
    term: '종사자 지원',
    q4: '이번 종사자 지원이 업무에 실질적으로 도움이 되었습니까?',
    specialized: [
      { type: 'scale', text: '종사자 지원사업 내용이 실제 처우 개선에 도움이 되었습니까?' },
      { type: 'scale', text: '종사자 지원사업 관련 광역의 사전 안내가 충분하였습니까?' },
      { type: 'scale', text: '신청 절차 진행 과정에서 광역 담당자의 응대가 신속하였습니까?' },
      { type: 'scale', text: '이번 종사자 지원사업 참여가 실무에 도움이 되었습니까?' },
      { type: 'para',  text: '이번 종사자 지원사업 관련 광역에 바라는 점을 적어주세요.' },
    ]
  },
};

// ============================================================
// SECTION 5: 현장설문 폼 생성 함수
// ============================================================

function createJForm(spec) {
  const isLS = (spec.code === 'J04' || spec.code === 'J06');
  const totalQ = isLS ? '14문항' : '13문항';

  const form = FormApp.create(
    spec.code + '_' + spec.title + '_' + spec.target + '_2026'
  );

  setupForm(form,
    '[' + spec.code + '] ' + spec.title + ' (' + spec.target + ')',
    '경상남도사회서비스원 노인맞춤돌봄서비스 광역지원기관\n' +
    '응답 대상: ' + spec.target + ' | 총 ' + totalQ + '\n' +
    '※ 이 설문은 익명으로 처리됩니다. 해당 사업 참여 직후 응답해 주세요.'
  );

  // 1페이지: 도입부 (Q01~Q03)
  addJIntro(form);

  // 2페이지: 공통 만족도 (Q04~Q08)
  addPage(form, '공통 문항', '이번 ' + spec.title + '에 대해 평가해 주세요.');
  addJCommon(form, spec.term, spec.q4);

  // 3페이지: 특화 문항 (Q09~)
  addPage(form, '세부 평가', '이번 ' + spec.title + '의 세부 내용을 평가해 주세요.');
  spec.specialized.forEach(function(q, idx) {
    const qNum = 9 + idx;
    if (q.type === 'scale') {
      addScale(form, qNum, q.text, SCALE5);
    } else if (q.type === 'mc') {
      addMC(form, qNum, q.text, q.choices,
        q.isNeeds ? '※ 다음 회차 프로그램 기획에 반영됩니다.' : null);
    } else if (q.type === 'para') {
      addPara(form, qNum, q.text);
    }
  });

  Logger.log('[' + spec.code + '] ' + spec.title +
    ' (' + spec.target + ')\n' + form.getPublishedUrl());
}

// ============================================================
// SECTION 6: 마스터 실행 함수
// ============================================================

function createAllJForms() {
  Logger.log('=== 현장설문 16종 생성 시작 ===\n');

  const jCodes = [
    'J01','J03','J04','J05','J06','J07','J08',
    'J09','J10','J11','J12','J13','J14','J15','J16','J17'
  ];

  jCodes.forEach(function(code) {
    createJForm(J_SPECS[code]);
    Utilities.sleep(1500);
  });

  Logger.log('\n=== 16종 생성 완료 ===');
}

/**
 * 단일 폼만 재생성 (개별 수정 필요 시)
 * 예: recreateJForm('J01')
 */
function recreateJForm(code) {
  if (J_SPECS[code]) {
    createJForm(J_SPECS[code]);
  } else {
    Logger.log('알 수 없는 코드: ' + code);
  }
}
