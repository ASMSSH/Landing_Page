export const SUBSCRIBE_ERROR_MESSAGES: Record<string, string> = {
  invalid_phone: '휴대전화번호 형식을 확인해 주세요.',
  server_not_configured: '서버 설정이 아직 완료되지 않았어요.',
  object_not_found: '연동 대상을 찾지 못했어요. 잠시 후 다시 시도해 주세요.',
  phone_not_verified: '휴대전화 인증을 먼저 완료해 주세요.',
};

export const OTP_ERROR_MESSAGES: Record<string, string> = {
  invalid_phone: '휴대전화번호 형식을 확인해 주세요.',
  sms_send_failed: '인증번호 발송에 실패했어요. 잠시 후 다시 시도해 주세요.',
  server_not_configured: '서버 설정이 아직 완료되지 않았어요.',
  invalid_token: '인증 정보가 올바르지 않아요. 다시 시도해 주세요.',
  invalid_code: '인증번호가 일치하지 않아요.',
  code_expired: '인증번호가 만료됐어요. 다시 받아주세요.',
  too_many_attempts: '시도 횟수를 초과했어요. 인증번호를 다시 받아주세요.',
  network_error: '네트워크 오류예요. 잠시 후 다시 시도해 주세요.',
};
