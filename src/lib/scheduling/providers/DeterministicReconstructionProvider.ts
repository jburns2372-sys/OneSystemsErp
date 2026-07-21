import { AIProposalType, SchedulingProvider, SchedulingProviderContext } from '../types';

export class DeterministicReconstructionProvider implements SchedulingProvider {
  async generateProposal(context: SchedulingProviderContext): Promise<AIProposalType> {
    return {
  "phases": [
    {
      "phaseName": "Phase 1",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-1",
          "activityName": "Activity 1",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [
            "GRP_1",
            "GRP_2",
            "GRP_3",
            "GRP_4",
            "GRP_5",
            "GRP_6",
            "GRP_7",
            "GRP_8",
            "GRP_9",
            "GRP_10",
            "GRP_11",
            "GRP_12",
            "GRP_13",
            "GRP_14",
            "GRP_15",
            "GRP_16",
            "GRP_17",
            "GRP_18",
            "GRP_19",
            "GRP_20",
            "GRP_21",
            "GRP_22",
            "GRP_23",
            "GRP_24",
            "GRP_25",
            "GRP_26",
            "GRP_27",
            "GRP_28",
            "GRP_29",
            "GRP_30",
            "GRP_31",
            "GRP_32",
            "GRP_33",
            "GRP_34",
            "GRP_35",
            "GRP_36",
            "GRP_37",
            "GRP_38",
            "GRP_39",
            "GRP_40",
            "GRP_41",
            "GRP_42",
            "GRP_43",
            "GRP_44",
            "GRP_45",
            "GRP_46",
            "GRP_47",
            "GRP_48",
            "GRP_49",
            "GRP_50",
            "GRP_51",
            "GRP_52",
            "GRP_53",
            "GRP_54",
            "GRP_55",
            "GRP_56",
            "GRP_57",
            "GRP_58",
            "GRP_59",
            "GRP_60",
            "GRP_61",
            "GRP_62",
            "GRP_63",
            "GRP_64",
            "GRP_65",
            "GRP_66",
            "GRP_67",
            "GRP_68",
            "GRP_69",
            "GRP_70",
            "GRP_71",
            "GRP_72",
            "GRP_73",
            "GRP_74",
            "GRP_75",
            "GRP_76",
            "GRP_77",
            "GRP_78",
            "GRP_79",
            "GRP_80",
            "GRP_81",
            "GRP_82",
            "GRP_83",
            "GRP_84",
            "GRP_85",
            "GRP_86",
            "GRP_87",
            "GRP_88",
            "GRP_89",
            "GRP_90",
            "GRP_91",
            "GRP_92",
            "GRP_93",
            "GRP_94",
            "GRP_95",
            "GRP_96",
            "GRP_97",
            "GRP_98",
            "GRP_99",
            "GRP_100",
            "GRP_101",
            "GRP_102",
            "GRP_103",
            "GRP_104",
            "GRP_105",
            "GRP_106",
            "GRP_107",
            "GRP_108",
            "GRP_109",
            "GRP_110",
            "GRP_111",
            "GRP_112",
            "GRP_113",
            "GRP_114",
            "GRP_115",
            "GRP_116",
            "GRP_117",
            "GRP_118",
            "GRP_119",
            "GRP_120",
            "GRP_121",
            "GRP_122",
            "GRP_123",
            "GRP_124",
            "GRP_125",
            "GRP_126",
            "GRP_127",
            "GRP_128",
            "GRP_129",
            "GRP_130",
            "GRP_131",
            "GRP_132",
            "GRP_133",
            "GRP_134",
            "GRP_135",
            "GRP_136",
            "GRP_137",
            "GRP_138",
            "GRP_139",
            "GRP_140",
            "GRP_141",
            "GRP_142",
            "GRP_143",
            "GRP_144",
            "GRP_145",
            "GRP_146",
            "GRP_147",
            "GRP_148",
            "GRP_149",
            "GRP_150",
            "GRP_151",
            "GRP_152",
            "GRP_153",
            "GRP_154",
            "GRP_155",
            "GRP_156",
            "GRP_157",
            "GRP_158",
            "GRP_159",
            "GRP_160",
            "GRP_161",
            "GRP_162",
            "GRP_163",
            "GRP_164",
            "GRP_165",
            "GRP_166",
            "GRP_167",
            "GRP_168",
            "GRP_169",
            "GRP_170",
            "GRP_171",
            "GRP_172",
            "GRP_173",
            "GRP_174",
            "GRP_175",
            "GRP_176",
            "GRP_177",
            "GRP_178",
            "GRP_179",
            "GRP_180",
            "GRP_181",
            "GRP_182",
            "GRP_183",
            "GRP_184",
            "GRP_185",
            "GRP_186",
            "GRP_187",
            "GRP_188",
            "GRP_189",
            "GRP_190",
            "GRP_191",
            "GRP_192",
            "GRP_193",
            "GRP_194",
            "GRP_195",
            "GRP_196",
            "GRP_197",
            "GRP_198",
            "GRP_199",
            "GRP_200",
            "GRP_201",
            "GRP_202",
            "GRP_203",
            "GRP_204",
            "GRP_205",
            "GRP_206",
            "GRP_207",
            "GRP_208",
            "GRP_209",
            "GRP_210",
            "GRP_211",
            "GRP_212",
            "GRP_213",
            "GRP_214",
            "GRP_215",
            "GRP_216",
            "GRP_217",
            "GRP_218",
            "GRP_219",
            "GRP_220",
            "GRP_221",
            "GRP_222",
            "GRP_223",
            "GRP_224",
            "GRP_225",
            "GRP_226",
            "GRP_227",
            "GRP_228",
            "GRP_229",
            "GRP_230",
            "GRP_231",
            "GRP_232",
            "GRP_233",
            "GRP_234",
            "GRP_235",
            "GRP_236",
            "GRP_237",
            "GRP_238",
            "GRP_239",
            "GRP_240",
            "GRP_241",
            "GRP_242",
            "GRP_243",
            "GRP_244",
            "GRP_245",
            "GRP_246",
            "GRP_247",
            "GRP_248",
            "GRP_249",
            "GRP_250",
            "GRP_251",
            "GRP_252",
            "GRP_253",
            "GRP_254",
            "GRP_255",
            "GRP_256",
            "GRP_257",
            "GRP_258",
            "GRP_259",
            "GRP_260",
            "GRP_261",
            "GRP_262",
            "GRP_263",
            "GRP_264",
            "GRP_265",
            "GRP_266",
            "GRP_267",
            "GRP_268",
            "GRP_269",
            "GRP_270",
            "GRP_271",
            "GRP_272",
            "GRP_273",
            "GRP_274",
            "GRP_275",
            "GRP_276",
            "GRP_277",
            "GRP_278",
            "GRP_279",
            "GRP_280",
            "GRP_281",
            "GRP_282",
            "GRP_283",
            "GRP_284",
            "GRP_285",
            "GRP_286",
            "GRP_287",
            "GRP_288",
            "GRP_289",
            "GRP_290",
            "GRP_291",
            "GRP_292",
            "GRP_293",
            "GRP_294",
            "GRP_295",
            "GRP_296",
            "GRP_297",
            "GRP_298",
            "GRP_299",
            "GRP_300",
            "GRP_301",
            "GRP_302",
            "GRP_303",
            "GRP_304",
            "GRP_305",
            "GRP_306",
            "GRP_307",
            "GRP_308",
            "GRP_309",
            "GRP_310",
            "GRP_311",
            "GRP_312",
            "GRP_313",
            "GRP_314",
            "GRP_315",
            "GRP_316",
            "GRP_317",
            "GRP_318",
            "GRP_319",
            "GRP_320",
            "GRP_321",
            "GRP_322",
            "GRP_323",
            "GRP_324",
            "GRP_325",
            "GRP_326"
          ],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 2",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-2",
          "activityName": "Activity 2",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-1",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 3",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-3",
          "activityName": "Activity 3",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-2",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 4",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-4",
          "activityName": "Activity 4",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-3",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 5",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-5",
          "activityName": "Activity 5",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-4",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 6",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-6",
          "activityName": "Activity 6",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-5",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 7",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-7",
          "activityName": "Activity 7",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-6",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 8",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-8",
          "activityName": "Activity 8",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-7",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 9",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-9",
          "activityName": "Activity 9",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-8",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Phase 10",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-10",
          "activityName": "Activity 10",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-9",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Testing and Commissioning",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-11",
          "activityName": "Activity 11",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 10,
          "predecessors": [
            {
              "key": "ACT-10",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    },
    {
      "phaseName": "Project Acceptance and Demobilization",
      "rationale": "Standard schedule block",
      "activities": [
        {
          "temporaryActivityKey": "ACT-12",
          "activityName": "Activity 12",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 8,
          "predecessors": [
            {
              "key": "ACT-11",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        },
        {
          "temporaryActivityKey": "ACT-13",
          "activityName": "Activity 13",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 8,
          "predecessors": [
            {
              "key": "ACT-12",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        },
        {
          "temporaryActivityKey": "ACT-14",
          "activityName": "Activity 14",
          "durationMethod": "FIXED_TECHNICAL_DURATION",
          "discipline": "General",
          "assignedBOQItemIds": [],
          "productivityAssumption": null,
          "crewCountAssumption": null,
          "workFrontAssumption": null,
          "fixedTechnicalDuration": 8,
          "predecessors": [
            {
              "key": "ACT-13",
              "type": "FS",
              "lag": 0
            }
          ],
          "confidence": 100
        }
      ]
    }
  ]
} as AIProposalType;
  }
}
