export const SUBJECTS = {
  "subjects": [
    {
      "code": "MA13001",
      "semester": 1,
      "languages": ["es", "en"],
      "name": {
        "es": "Matemáticas I: lenguaje de la ciencia",
        "en": "Mathematics I: language of science"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "SO13001",
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
      "code": "CM13001",
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
      "code": "OPT_LENG_ES_I",
      "semester": 1,
      "languages": ["es"],
      "name": {
        "es": "Optativa de lengua adicional al español I"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "CG13001",
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
      "code": "CS13001",
      "semester": 1,
      "languages": ["es", "en"],
      "name": {
        "es": "Tecnologías de la información I",
        "en": "Information technologies"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "HP13001",
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
      "code": "MA13002",
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
      "code": "HS13001",
      "semester": 2,
      "languages": ["es", "en"],
      "name": {
        "es": "Historia de México",
        "en": "History of Mexico"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "CM13002",
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
      "code": "OPT_LENG_ES_II",
      "semester": 2,
      "languages": ["es"],
      "name": {
        "es": "Optativa de lengua adicional al español II"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_I"]
    },
    {
      "code": "QU13001",
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
      "code": "CS13002",
      "semester": 2,
      "languages": ["es", "en"],
      "name": {
        "es": "Tecnologías de la información II",
        "en": "Information technologies II"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["CS13001"]
    },
    {
      "code": "HP13002",
      "semester": 2,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores II: ser crítico"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": ["HP13001"]
    },

    {
      "code": "MA13003",
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
      "code": "HS13002",
      "semester": 3,
      "languages": ["es", "en"],
      "name": {
        "es": "México contemporáneo",
        "en": "Contemporary Mexico"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "LI13001",
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
      "code": "OPT_LENG_ES_III",
      "semester": 3,
      "languages": ["es"],
      "name": {
        "es": "Optativa de lengua adicional al español III"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_II"]
    },
    {
      "code": "QU13002",
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
      "code": "HP13003",
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
      "code": "HP13004",
      "semester": 3,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores III: ser creativo"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["HP13002"]
    },

    {
      "code": "MA13004",
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
      "code": "SO13002",
      "semester": 4,
      "languages": ["es", "en"],
      "name": {
        "es": "Antropología: cultura y consciencia social",
        "en": "Anthropology, culture and social conscience"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "LI13002",
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
      "code": "OPT_LENG_ES_IV",
      "semester": 4,
      "languages": ["es"],
      "name": {
        "es": "Optativa de lengua adicional al español IV"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_III"]
    },
    {
      "code": "FI13001",
      "semester": 4,
      "languages": ["es", "en"],
      "name": {
        "es": "Materia y energía I",
        "en": "Mass and energy I"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["QU13002"]
    },
    {
      "code": "BI13001",
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
      "code": "HP13005",
      "semester": 4,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores IV: plan de vida y carrera"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["HP13004"]
    },

    {
      "code": "SO13003",
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
      "semester": 5,
      "languages": ["es"],
      "name": {
        "es": "Cálculo diferencial"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "OPT_LENG_ES_V",
      "semester": 5,
      "languages": ["es"],
      "name": {
        "es": "Optativa de lengua adicional al español V"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["OPT_LENG_ES_IV"]
    },
    {
      "code": "FI13002",
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
      "code": "BI13002",
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
      "code": "HP13006",
      "semester": 5,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores V: lenguaje, emoción y cuerpo"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["HP13005"]
    },

    {
      "code": "HP13007",
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
      "semester": 6,
      "languages": ["es", "en"],
      "name": {
        "es": "Arte y cultura",
        "en": "Art and culture"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "MA13005",
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Cálculo integral"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["MA13006"]
    },
    {
      "code": "OPT_MOD_FORM_I",
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Optativa módulo de formación I"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "FL13001",
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Pensamiento filosófico"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": []
    },
    {
      "code": "SO13004",
      "semester": 6,
      "languages": ["es", "en"],
      "name": {
        "es": "México en el siglo XXI",
        "en": "Mexico in the 21st century"
      },
      "hours": 3,
      "credits": 6,
      "prerequisites": []
    },
    {
      "code": "HP13008",
      "semester": 6,
      "languages": ["es"],
      "name": {
        "es": "Habilidades y valores VI: integración y toma de decisiones"
      },
      "hours": 5,
      "credits": 10,
      "prerequisites": ["HP13006"]
    }
  ]
};