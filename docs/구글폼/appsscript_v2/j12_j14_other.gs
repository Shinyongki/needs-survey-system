/**
 * ============================================================================
 * j12_j14_other.gs — 기타 지원사업 현장설문 3종
 * ----------------------------------------------------------------------------
 *  J12 AI·디지털 기기 지원사업 (11문항)
 *  J13 더(THE) 나눔사업 (11문항)
 *  J14 안심 돌봄 캠페인 (12문항)
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// J12 AI·디지털 기기 지원사업 (11문항)
// ---------------------------------------------------------------------------
function createJ12Form() {
  const form = FormApp.create('J12 AI·디지털 기기 지원사업 현장설문');
  form.setDescription(
    '본 설문은 이번 AI·디지털 기기 지원사업에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 11문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J12', CONFIG.INITIAL_ROUNDS.J12);

  addSection(form, '이번 지원 평가',
    '다음 문항은 이번 AI·디지털 기기 지원사업에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 게이트웨이·돌봄로봇 관련 광역의 운영 지침과 안내 자료가 충분하였습니까?');
  addAgreeScale(form, '[공통-2] AI·디지털 기기 관련 문의·요청 시 광역 담당자의 응대가 신속하였습니까?');
  addAgreeScale(form, '[공통-3] 광역의 AI·디지털 기기 지원이 현장 업무에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] AI·디지털 기기 지원사업에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[E1-1] 돌봄로봇 배포·관리 관련 광역 지원이 충분하였습니까?');
  addAgreeScale(form, '[E1-2] AI·디지털 기기 관련 이용자 교육 자료·가이드가 충분하였습니까?');
  addLongText(form, '[E1-3] AI·디지털 기기 지원 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J12 AI·디지털 기기 지원사업');
  const mappings = getFieldIntroMappings('J12').concat([
    { title: '[공통-1] 게이트웨이·돌봄로봇 관련 광역의 운영 지침과 안내 자료가 충분하였습니까?', code: '공통-1' },
    { title: '[공통-2] AI·디지털 기기 관련 문의·요청 시 광역 담당자의 응대가 신속하였습니까?', code: '공통-2' },
    { title: '[공통-3] 광역의 AI·디지털 기기 지원이 현장 업무에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] AI·디지털 기기 지원사업에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[E1-1] 돌봄로봇 배포·관리 관련 광역 지원이 충분하였습니까?', code: 'E1-1' },
    { title: '[E1-2] AI·디지털 기기 관련 이용자 교육 자료·가이드가 충분하였습니까?', code: 'E1-2' },
    { title: '[E1-3] AI·디지털 기기 지원 관련 광역에 바라는 점을 적어주세요.', code: 'E1-3' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J12 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J13 더(THE) 나눔사업 (11문항)
// ---------------------------------------------------------------------------
function createJ13Form() {
  const form = FormApp.create('J13 더(THE) 나눔사업 현장설문');
  form.setDescription(
    '본 설문은 이번 더(THE) 나눔사업에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 11문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J13', CONFIG.INITIAL_ROUNDS.J13);

  addSection(form, '이번 배부 평가',
    '다음 문항은 이번 나눔사업에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 물품 배부 일정·신청 절차 안내가 충분하고 사전에 공유되었습니까?');
  addAgreeScale(form, '[공통-2] 물품 배부 집결 장소·시간이 참여하기 편리하였습니까?');
  addAgreeScale(form, '[공통-3] 배부된 물품이 이용자 서비스 제공에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 나눔사업에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[E2-1] 배부된 물품이 이용자 필요에 적합하였습니까?');
  addAgreeScale(form, '[E2-2] 나눔사업 진행 과정에서 광역 담당자와 소통이 원활하였습니까?');
  addLongText(form, '[E2-3] 나눔사업 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J13 더(THE) 나눔사업');
  const mappings = getFieldIntroMappings('J13').concat([
    { title: '[공통-1] 물품 배부 일정·신청 절차 안내가 충분하고 사전에 공유되었습니까?', code: '공통-1' },
    { title: '[공통-2] 물품 배부 집결 장소·시간이 참여하기 편리하였습니까?', code: '공통-2' },
    { title: '[공통-3] 배부된 물품이 이용자 서비스 제공에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 나눔사업에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[E2-1] 배부된 물품이 이용자 필요에 적합하였습니까?', code: 'E2-1' },
    { title: '[E2-2] 나눔사업 진행 과정에서 광역 담당자와 소통이 원활하였습니까?', code: 'E2-2' },
    { title: '[E2-3] 나눔사업 관련 광역에 바라는 점을 적어주세요.', code: 'E2-3' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J13 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J14 안심 돌봄 캠페인 (12문항)
// ---------------------------------------------------------------------------
function createJ14Form() {
  const form = FormApp.create('J14 안심 돌봄 캠페인 현장설문');
  form.setDescription(
    '본 설문은 이번 안심 돌봄 캠페인에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 12문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J14', CONFIG.INITIAL_ROUNDS.J14);

  addSection(form, '이번 캠페인 평가',
    '다음 문항은 이번 안심 돌봄 캠페인에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 캠페인 사전에 홍보물·배포 자료 및 진행 일정이 충분히 제공되었습니까?');
  addAgreeScale(form, '[공통-2] 캠페인 진행 방식(일정·장소·방법)이 수행기관이 참여하기에 적절하였습니까?');
  addAgreeScale(form, '[공통-3] 캠페인이 이용자·지역사회의 서비스 인식 제고에 효과적이었습니까?');
  addSatisfyScale(form, '[공통-4] 캠페인에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[E3-1] 캠페인 홍보물이 서비스 홍보에 실질적으로 도움이 되었습니까?');
  addSingleChoice(form,
    '[E3-2] 이번 캠페인에서 제공된 홍보 물품 중 이용자 홍보에 가장 효과적이었던 것은?',
    ['생활용품(미니 선풍기·핫팩·우산 등)', '식품·간식류(음료·과자·건강식품 등)',
     '위생용품(마스크·손소독제·치약 등)', '문구·생활잡화(수건·볼펜·노트 등)',
     '계절용품(여름 아이스팩·겨울 방한용품 등)', '해당 없음(물품 미제공)'],
    true
  );
  addSingleChoice(form,
    '[E3-3] 캠페인에서 가장 효과적이었던 홍보 채널은?',
    ['사회관계망서비스(카카오·인스타그램 등)', '지역 언론·신문', '현수막·포스터'],
    true
  );
  addLongText(form, '[E3-4] 캠페인 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J14 안심 돌봄 캠페인');
  const mappings = getFieldIntroMappings('J14').concat([
    { title: '[공통-1] 캠페인 사전에 홍보물·배포 자료 및 진행 일정이 충분히 제공되었습니까?', code: '공통-1' },
    { title: '[공통-2] 캠페인 진행 방식(일정·장소·방법)이 수행기관이 참여하기에 적절하였습니까?', code: '공통-2' },
    { title: '[공통-3] 캠페인이 이용자·지역사회의 서비스 인식 제고에 효과적이었습니까?', code: '공통-3' },
    { title: '[공통-4] 캠페인에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[E3-1] 캠페인 홍보물이 서비스 홍보에 실질적으로 도움이 되었습니까?', code: 'E3-1' },
    { title: '[E3-2] 이번 캠페인에서 제공된 홍보 물품 중 이용자 홍보에 가장 효과적이었던 것은?', code: 'E3-2' },
    { title: '[E3-3] 캠페인에서 가장 효과적이었던 홍보 채널은?', code: 'E3-3' },
    { title: '[E3-4] 캠페인 관련 광역에 바라는 점을 적어주세요.', code: 'E3-4' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J14 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}
