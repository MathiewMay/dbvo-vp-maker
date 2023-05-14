export interface Subscription {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  professional_voice_limit: number;
  can_extend_voice_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  can_use_delayed_payment_methods: boolean;
  currency: string;
  status: string;
}

export interface UserInfo {
  subscription: Subscription;
  is_new_user: boolean;
  xi_api_key: string;
}

export function jsonToUserInfo(json: any): UserInfo {
  const subscription: Subscription = {
    tier: json.subscription.tier,
    character_count: json.subscription.character_count,
    character_limit: json.subscription.character_limit,
    can_extend_character_limit: json.subscription.can_extend_character_limit,
    allowed_to_extend_character_limit: json.subscription.allowed_to_extend_character_limit,
    next_character_count_reset_unix: json.subscription.next_character_count_reset_unix,
    voice_limit: json.subscription.voice_limit,
    professional_voice_limit: json.subscription.professional_voice_limit,
    can_extend_voice_limit: json.subscription.can_extend_voice_limit,
    can_use_instant_voice_cloning: json.subscription.can_use_instant_voice_cloning,
    can_use_professional_voice_cloning: json.subscription.can_use_professional_voice_cloning,
    can_use_delayed_payment_methods: json.subscription.can_use_delayed_payment_methods,
    currency: json.subscription.currency,
    status: json.subscription.status
  };

  const userInfo: UserInfo = {
    subscription: subscription,
    is_new_user: json.is_new_user,
    xi_api_key: json.xi_api_key
  };

  return userInfo;
}
