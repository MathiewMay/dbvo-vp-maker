export interface Model {
  can_be_finetuned: boolean;
  can_do_text_to_speech: number;
  can_do_voice_conversion: number;
  description: boolean;
  languages: Language[];
  model_id: string;
  name: string;
  token_cost_factor: number;
}

export interface Language {
  language_id: string;
  name: string;
}

export function jsonToModel(json: any): Model {
  const model: Model = {
    can_be_finetuned: json.can_be_finetuned,
    can_do_text_to_speech: json.can_do_text_to_speech,
    can_do_voice_conversion: json.can_do_voice_conversion,
    description: json.description,
    languages: json.languages.map((language: any) => {
      return {
        language_id: language.language_id,
        name: language.name
      };
    }),
    model_id: json.model_id,
    name: json.name,
    token_cost_factor: json.token_cost_factor
  };

  return model;
}
