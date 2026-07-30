export const SUBJECTS = {
  "subjects": [
    {
      "code": "BSMA1001",
      "curriculumCode": "MA13001",
      "semester": 1,
      "languages": ["es"],
      "name": {
        "es": "Matemáticas I: lenguaje de la ciencia"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "BSHU1004",
      "curriculumCode": "SO13001",
      "codes": ["BSHU1004", "BSHU1005"],
      "semester": 1,
      "languages": ["es", "en"],
      "name": {
        "es": "El ser humano en sociedad",
        "en": "Human being in society"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "BSHU1002",
      "curriculumCode": "CM13001",
      "semester": 1,
      "languages": ["es"],
      "name": {
        "es": "Lectura y redacción"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "BSOP1006",
      "curriculumCode": "OPT_LENG_ES_I",
      "codes": ["BSOP1006", "BSOP1001", "PI13022"],
      "semester": 1,
      "languages": ["es"],
      "name": {
        "es": "Lengua adicional al Español I",
        "additional": "Francés I, Inglés I, Italiano I, Portugués I, Alemán I, Chino I, Japonés I"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "BSCN1005",
      "curriculumCode": "CG13001",
      "codes": ["BSCN1005", "BSCN1006"],
      "semester": 1,
      "languages": ["es", "en"],
      "name": {
        "es": "Ecología y geografía",
        "en": "Ecology and geography"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "BSTI1001",
      "curriculumCode": "CS13001",
      "codes": ["BSTI1001", "BSTI1003"],
      "semester": 1,
      "languages": ["es", "en"],
      "name": {
        "es": "Tecnologías de información I",
        "en": "Information technologies"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "BSLI1001",
      "curriculumCode": "HP13001",
      "semester": 1,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores I: bienestar"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },

    {
      "code": "BSMA1002",
      "curriculumCode": "MA13002",
      "codes": ["BSMA1002", "BSMA1003"],
      "semester": 2,
      "languages": ["es", "en"],
      "name": {
        "es": "Matemáticas II: pensamiento matemático",
        "en": "Math II: mathematical thinking"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["MA13001"]
    },
    {
      "code": "BSHU1001",
      "curriculumCode": "HS13001",
      "semester": 2,
      "languages": ["es"],
      "name": {
        "es": "Historia de México"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "BSHU1003",
      "curriculumCode": "CM13002",
      "semester": 2,
      "languages": ["es"],
      "name": {
        "es": "Comunicación integral"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["CM13001"]
    },
    {
      "code": "BSOP1002",
      "curriculumCode": "OPT_LENG_ES_II",
      "codes": ["BSOP1002", "BSOP1012", "BSHI1032"],
      "semester": 2,
      "languages": ["es"],
      "name": {
        "es": "Lengua adicional al Español II",
        "additional": "Francés II, Inglés II, Italiano II, Portugués II, Alemán II, Chino II, Japonés II"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_I"]
    },
    {
      "code": "BSCN1001",
      "curriculumCode": "QU13001",
      "semester": 2,
      "languages": ["es"],
      "name": {
        "es": "Transformación de la materia"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["CG13001"]
    },
    {
      "code": "BSTI1002",
      "curriculumCode": "CS13002",
      "codes": ["BSTI1002", "BSTI1004"],
      "semester": 2,
      "languages": ["es", "en"],
      "name": {
        "es": "Tecnologías de información II",
        "en": "Information technologies II"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["CS13001"]
    },
    {
      "code": "BSLI1002",
      "curriculumCode": "HP13002",
      "semester": 2,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores II: ser crítico"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },

    {
      "code": "BSMA2001",
      "curriculumCode": "MA13003",
      "codes": ["BSMA2001", "BSMA2003"],
      "semester": 3,
      "languages": ["es", "en"],
      "name": {
        "es": "Matemáticas III: periodicidad y repetición",
        "en": "Math III: regularity and repetition"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["MA13002"]
    },
    {
      "code": "BSHU2001",
      "curriculumCode": "HS13002",
      "semester": 3,
      "languages": ["es"],
      "name": {
        "es": "México contemporáneo"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["HS13001"]
    },
    {
      "code": "BSHU2003",
      "curriculumCode": "LI13001",
      "codes": ["BSHU2003", "BSHU2004"],
      "semester": 3,
      "languages": ["es", "en"],
      "name": {
        "es": "Los grandes escritores universales",
        "en": "Great universal writers"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["CM13002"]
    },
    {
      "code": "BSOP1003",
      "curriculumCode": "OPT_LENG_ES_III",
      "codes": ["BSOP1003", "BSOP1013", "BSHI1035", "PI13023", "BSOP1007"],
      "semester": 3,
      "languages": ["es"],
      "name": {
        "es": "Lengua adicional al Español III","additional": "Francés III, Inglés III, Italiano III, Portugués III, Alemán III, Chino III, Japonés III"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_II"]
    },
    {
      "code": "BSCN1002",
      "curriculumCode": "QU13002",
      "semester": 3,
      "languages": ["es"],
      "name": {
        "es": "El carbono y sus compuestos"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["QU13001"]
    },
    {
      "code": "BSLI2001",
      "curriculumCode": "HP13003",
      "semester": 3,
      "languages": ["es"],
      "name": {
        "es": "Conceptos y dilemas éticos"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "BSLI2002",
      "curriculumCode": "HP13004",
      "semester": 3,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores III: ser creativo"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },

    {
      "code": "BSMA2002",
      "curriculumCode": "MA13004",
      "codes": ["BSMA2002", "BSMA2004"],
      "semester": 4,
      "languages": ["es", "en"],
      "name": {
        "es": "Matemáticas IV: modelos matemáticos",
        "en": "Math IV: mathematical models"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["MA13003"]
    },
    {
      "code": "BSHU2005",
      "curriculumCode": "SO13002",
      "codes": ["BSHU2005", "BSHU2006"],
      "semester": 4,
      "languages": ["es", "en"],
      "name": {
        "es": "Antropología: cultura y consciencia social",
        "en": "Anthropology, culture and social conscience"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["SO13001"]
    },
    {
      "code": "BSHU2002",
      "curriculumCode": "LI13002",
      "semester": 4,
      "languages": ["es"],
      "name": {
        "es": "Expresión literaria"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["LI13001"]
    },
    {
      "code": "BSOP1004",
      "curriculumCode": "OPT_LENG_ES_IV",
      "codes": ["BSOP1004", "BSOP1009", "BSOP1014", "BSHI1036", "BSOP1008", "PI13024"],
      "semester": 4,
      "languages": ["es"],
      "name": {
        "es": "Lengua adicional al Español IV",
        "additional": "Francés IV, Inglés IV, Italiano IV, Portugués IV, Alemán IV, Chino IV, Japonés IV"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_III"]
    },
    {
      "code": "BSCN2001",
      "curriculumCode": "FI13001",
      "codes": ["BSCN2001", "BSCN2003"],
      "semester": 4,
      "languages": ["es", "en"],
      "name": {
        "es": "Materia y energía I",
        "en": "Mass and energy I"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["MA13002"]
    },
    {
      "code": "BI13001",
      "curriculumCode": "BI13001",
      "codes": ["BI13001", "BSCN2005", "BSCN2006"],
      "semester": 4,
      "languages": ["es", "en"],
      "name": {
        "es": "Ciencias de la vida",
        "en": "Life science"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "BSLI3001",
      "curriculumCode": "HP13005",
      "semester": 4,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores IV: plan de vida y carrera"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },

    {
      "code": "BSHU3009",
      "curriculumCode": "SO13003",
      "semester": 5,
      "languages": ["es"],
      "name": {
        "es": "Expresión musical"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "HS13003",
      "curriculumCode": "HS13003",
      "codes": ["HS13003", "BSHU3008"],
      "semester": 5,
      "languages": ["es", "en"],
      "name": {
        "es": "El mundo contemporáneo",
        "en": "Contemporary world"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "MA13006",
      "curriculumCode": "MA13006",
      "semester": 5,
      "languages": ["es"],
      "name": {
        "es": "Optativa módulo de formación I"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "BSOP1005",
      "curriculumCode": "OPT_LENG_ES_V",
      "codes": ["BSOP1005", "BSOP1010", "BSOP1015", "BSHI1037", "PI13021", "PI13025"],
      "semester": 5,
      "languages": ["es"],
      "name": {
        "es": "Lengua adicional al Español V",
        "additional": "Francés V, Inglés V, Italiano V, Portugués V, Alemán V, Chino V, Japonés V"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_IV"]
    },
    {
      "code": "BSCN2002",
      "curriculumCode": "FI13002",
      "codes": ["BSCN2002", "BSCN2004"],
      "semester": 5,
      "languages": ["es", "en"],
      "name": {
        "es": "Materia y energía II",
        "en": "Mass and energy II"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["FI13001"]
    },
    {
      "code": "BSCN3001",
      "curriculumCode": "BI13002",
      "codes": ["BSCN3001", "BSCN3002"],
      "semester": 5,
      "languages": ["es", "en"],
      "name": {
        "es": "Cuidado del cuerpo humano",
        "en": "Human body care"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["BI13001"]
    },
    {
      "code": "BSLI3002",
      "curriculumCode": "HP13006",
      "semester": 5,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores V: lenguaje, emoción y cuerpo"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },

    {
      "code": "BSCN3003",
      "curriculumCode": "HP13007",
      "codes": ["BSCN3003", "BSCN3004"],
      "semester": 6,
      "languages": ["es", "en"],
      "name": {
        "es": "Pensamiento científico",
        "en": "Scientific thought"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "HS13004",
      "curriculumCode": "HS13004",
      "codes": ["HS13004", "BSHU3005", "BSHU3006"],
      "semester": 6,
      "languages": ["es", "en"],
      "name": {
        "es": "Arte y cultura",
        "en": "Art and culture"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["HS13003"]
    },
    {
      "code": "MA13005",
      "curriculumCode": "MA13005",
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Optativa módulo de formación III"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["MA13006"]
    },
    {
      "code": "OPT_MOD_FORM_I",
      "curriculumCode": "OPT_MOD_FORM_I",
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Optativa módulo de formación II"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "BSHU3010",
      "curriculumCode": "FL13001",
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Pensamiento filosófico"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["HP13003"]
    },
    {
      "code": "SO13004",
      "curriculumCode": "SO13004",
      "codes": ["SO13004", "BSEC3001"],
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "México en el siglo XXI"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["HS13002"]
    },
    {
      "code": "HP13008",
      "curriculumCode": "HP13008",
      "codes": ["HP13008", "BSLI3003"],
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores VI: Integración y toma de decisiones"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    }
  ]
};
