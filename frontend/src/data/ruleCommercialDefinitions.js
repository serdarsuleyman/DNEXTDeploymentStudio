// Auto-generated from CR_BusinessDefinitions.json
export const RULE_COMMERCIAL_DEFINITIONS = {
  "CR000002": {
    "ruleId": "CR000002",
    "ruleName": "Sales Package at BB 1000 allowed  no oxg",
    "businessDefinition": "If BB 1000 available then all Sales Packages with allowed BB 1000 allowed (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Package sellable with Bandwidth 1000\" (FN36), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 1000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.201Z"
  },
  "CR000004": {
    "ruleId": "CR000004",
    "ruleName": "Sales Package at BB6000 allowed",
    "businessDefinition": "If BB 6000 available then all Sales Packages with allowed BB 1000 allowed (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 6000\" (FN38), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN38",
        "name": "Package sellable with Bandwidth 6000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 6000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR !Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR Cart contains product \"V0178\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000005": {
    "ruleId": "CR000005",
    "ruleName": "Sales Package at BB 16000 allowed not for Oxg",
    "businessDefinition": "If BB 1000 available then all Sales Packages with allowed BB 1000 allowed (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 16000\" (FN39), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN39",
        "name": "Package sellable with Bandwidth 16000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 16000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR !Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR Cart contains product \"V018C\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000006": {
    "ruleId": "CR000006",
    "ruleName": "Sales Package at BB25000 allowed",
    "businessDefinition": "If BB 25000 available then all Sales Packages with allowed BB 1000 allowed (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 25000\" (FN40), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN40",
        "name": "Package sellable with Bandwidth 25000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 25000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR !Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR Cart contains product \"V018G\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000007": {
    "ruleId": "CR000007",
    "ruleName": "Sales Package at BB50000 DSL allowed",
    "businessDefinition": "If BB 50000 available then all Sales Packages with allowed BB 1000 allowed; VFP update (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 50000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR !Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR Cart contains product \"V018H\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000012": {
    "ruleId": "CR000012",
    "ruleName": "Sales Package at BB 3600 allowed",
    "businessDefinition": "Allow all LTE tariffs if LTE 3600 is avalilable according to VFP result.",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"LTE Package\" (FN77), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 3600, 1, \"NGN-4G\", \"GRUEN\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000015": {
    "ruleId": "CR000015",
    "ruleName": "Fallback BB1000 at DSL 1000 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (6 conditions) are satisfied involving Category \"Package sellable with Bandwidth 1000\" (FN36), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN36: Package sellable with Bandwidth 1000\"",
      "Line technology check: 1000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 2000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 6000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 16000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR ( cart.package.isTariffChanged() equals true AND cart.package.hasProcessContext(\"ILSBLU\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000016": {
    "ruleId": "CR000016",
    "ruleName": "Fallback BB2000 at DSL 2000 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"Package sellable with Bandwidth 2000\" (FN37), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN37",
        "name": "Package sellable with Bandwidth 2000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN37: Package sellable with Bandwidth 2000\"",
      "Line technology check: 2000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 6000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 16000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR ( cart.package.isTariffChanged() equals true AND cart.package.hasProcessContext(\"ILSBLU\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000017": {
    "ruleId": "CR000017",
    "ruleName": "Fallback BB6000 at DSL 6000 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Package sellable with Bandwidth 6000\" (FN38), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN38",
        "name": "Package sellable with Bandwidth 6000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN38: Package sellable with Bandwidth 6000\"",
      "Line technology check: 6000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 16000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR ( cart.package.isTariffChanged() equals true AND cart.package.hasProcessContext(\"ILSBLU\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000018": {
    "ruleId": "CR000018",
    "ruleName": "Fallback BB16000 at DSL16000 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 16000\" (FN39), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN39",
        "name": "Package sellable with Bandwidth 16000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN39: Package sellable with Bandwidth 16000\"",
      "Line technology check: 16000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.202Z"
  },
  "CR000020": {
    "ruleId": "CR000020",
    "ruleName": "Fallback BB 25000 at DSL50 package is obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Package sellable with Bandwidth 25000\" (FN40), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN40",
        "name": "Package sellable with Bandwidth 25000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN40: Package sellable with Bandwidth 25000\"",
      "Line technology check: 25000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 50000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000022": {
    "ruleId": "CR000022",
    "ruleName": "Technology NGN-VDSL obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-395).",
    "plainLanguageIntent": "During [MIGCOC] on [DSL]: IF evaluation criteria (8 conditions) are satisfied involving Category \"Package sellable with Bandwidth 1000\" (FN36), \"Package sellable with Bandwidth 2000\" (FN37), \"Package sellable with Bandwidth 6000\" (FN38), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-395 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN37",
        "name": "Package sellable with Bandwidth 2000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN38",
        "name": "Package sellable with Bandwidth 6000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN39",
        "name": "Package sellable with Bandwidth 16000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN40",
        "name": "Package sellable with Bandwidth 25000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN36: Package sellable with Bandwidth 1000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 2000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(1000, \"GRUEN\", \"NGN-VDSL\", \"DSL\") AND !Cart contains product \"R708.2000000000-24\"",
      "Cart contains item in \"FN37: Package sellable with Bandwidth 2000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(2000, \"GRUEN\", \"NGN-VDSL\", \"DSL\")",
      "Cart contains item in \"FN38: Package sellable with Bandwidth 6000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(6000, \"GRUEN\", \"NGN-VDSL\", \"DSL\")",
      "Cart contains item in \"FN39: Package sellable with Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\")",
      "Cart contains item in \"FN40: Package sellable with Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\")",
      "Cart contains item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\")",
      "Cart contains item in \"FN69: Package sellable with Bandwidth 100000 DSL\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\")",
      "Cart contains product \"R708.2000000000-24\" AND availability.hasHighestPriority(1000, \"GRUEN\", \"NGN-VDSL\", \"DSL\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000024": {
    "ruleId": "CR000024",
    "ruleName": "Technology IP-Bitstream obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [MIGCOC] on [DSL]: IF evaluation criteria (8 conditions) are satisfied involving Category \"Package sellable with Bandwidth 1000\" (FN36), \"Package sellable with Bandwidth 2000\" (FN37), \"Package sellable with Bandwidth 6000\" (FN38), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN37",
        "name": "Package sellable with Bandwidth 2000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN38",
        "name": "Package sellable with Bandwidth 6000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN39",
        "name": "Package sellable with Bandwidth 16000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN40",
        "name": "Package sellable with Bandwidth 25000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN36: Package sellable with Bandwidth 1000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 2000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") AND !Cart contains product \"R708.2000000000-24\"",
      "Cart contains item in \"FN37: Package sellable with Bandwidth 2000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\")",
      "Cart contains item in \"FN38: Package sellable with Bandwidth 6000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\")",
      "Cart contains item in \"FN39: Package sellable with Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\")",
      "Cart contains item in \"FN40: Package sellable with Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") AND ( !Line technology check: 50000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\" OR Line technology check: 50000, 1, \"NGN-4G\", \"GRUEN\" )",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\")",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN69: Package sellable with Bandwidth 100000 DSL\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\")",
      "Cart contains product \"R708.2000000000-24\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000025": {
    "ruleId": "CR000025",
    "ruleName": "Technology IP-Bitstream  VDSL obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [MIGCOC] on [DSL]: IF evaluation criteria (10 conditions) are satisfied involving Category \"Package sellable with Bandwidth 1000\" (FN36), \"Package sellable with Bandwidth 2000\" (FN37), \"Package sellable with Bandwidth 6000\" (FN38), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN37",
        "name": "Package sellable with Bandwidth 2000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN38",
        "name": "Package sellable with Bandwidth 6000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN39",
        "name": "Package sellable with Bandwidth 16000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN40",
        "name": "Package sellable with Bandwidth 25000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN185",
        "name": "Package sellable with Bandwidth 175000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN36: Package sellable with Bandwidth 1000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 2000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Cart contains product \"R708.2000000000-24\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Cart contains item in \"FN37: Package sellable with Bandwidth 2000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Cart contains item in \"FN38: Package sellable with Bandwidth 6000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Cart contains item in \"FN39: Package sellable with Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Cart contains item in \"FN40: Package sellable with Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") AND ( !Line technology check: 50000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\" OR Line technology check: 50000, 1, \"NGN-4G\", \"GRUEN\" )",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN69: Package sellable with Bandwidth 100000 DSL\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Cart contains product \"R708.2000000000-24\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Package includes item in \"FN76: DSL Package\" AND !Line technology check: 250000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\" AND Cart contains item in \"FN185: Package sellable with Bandwidth 175000 DSL\" AND availability.hasHighestPriority(175000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND availability.hasHighestPriority(250000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000027": {
    "ruleId": "CR000027",
    "ruleName": "Technology IP-L2-BSA VDSL obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [MIGCOC] on [DSL]: IF evaluation criteria (10 conditions) are satisfied involving Category \"Package sellable with Bandwidth 1000\" (FN36), \"Package sellable with Bandwidth 2000\" (FN37), \"Package sellable with Bandwidth 6000\" (FN38), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN37",
        "name": "Package sellable with Bandwidth 2000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN38",
        "name": "Package sellable with Bandwidth 6000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN39",
        "name": "Package sellable with Bandwidth 16000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN40",
        "name": "Package sellable with Bandwidth 25000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN185",
        "name": "Package sellable with Bandwidth 175000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN36: Package sellable with Bandwidth 1000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 2000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Cart contains item in \"FN37: Package sellable with Bandwidth 2000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 6000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Cart contains item in \"FN38: Package sellable with Bandwidth 6000\" AND !Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Cart contains item in \"FN39: Package sellable with Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Cart contains item in \"FN40: Package sellable with Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") AND ( !Line technology check: 50000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\" OR Line technology check: 50000, 1, \"NGN-4G\", \"GRUEN\" )",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN69: Package sellable with Bandwidth 100000 DSL\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Cart contains product \"R708.2000000000-24\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Package includes item in \"FN76: DSL Package\" AND !Line technology check: 250000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\" AND Cart contains item in \"FN185: Package sellable with Bandwidth 175000 DSL\" AND availability.hasHighestPriority(175000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")",
      "Package includes item in \"FN76: DSL Package\" AND Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND availability.hasHighestPriority(250000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000086": {
    "ruleId": "CR000086",
    "ruleName": "One IAD in Package defaulted",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-451).",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"Access Hardware\" (FN158), THEN the target item is marked as [Eql(1)].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-451 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000087": {
    "ruleId": "CR000087",
    "ruleName": "Anschlusspreis - IP073V0083 at all Packages",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000108": {
    "ruleId": "CR000108",
    "ruleName": "Life Products in Category VTO from Catalogue allowed with Voice Access",
    "businessDefinition": "Life Products in Category VTO from Catalogue allowed with Voice Access in Cart.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Access Blocking Service\" (FN80), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN80",
        "name": "Access Blocking Service",
        "parentName": "Voice Tariff Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.containsProductInProductFamily(\"FNFamily8\")",
      "cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000110": {
    "ruleId": "CR000110",
    "ruleName": "ILSBLU: Package Upgrade in minimum Duration, so no cheaper packages Allowed",
    "businessDefinition": "ILS: Package Upgrade in minimum Duration.",
    "plainLanguageIntent": "During [ILSBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "!Cart contains product 10007",
      "!Cart contains product 10009"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000111": {
    "ruleId": "CR000111",
    "ruleName": "ILS: Package Change out of Minimum duration",
    "businessDefinition": "ILS: Package Change out of minimum Duration.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.hasTariffWithVersion(\">\")",
      "cart.package.tariffInMinimumDuration() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000143": {
    "ruleId": "CR000143",
    "ruleName": "ILS: Maximum one Fixnet flat option in cart",
    "businessDefinition": "ILS: Maximum one fixnet flat option in cart.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"Fixnet Flat Options\" (FN127), THEN the target item is marked as [MAX(1)].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "MAX(1)",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN127",
        "name": "Fixnet Flat Options",
        "parentName": "Voice Flat Options"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000156": {
    "ruleId": "CR000156",
    "ruleName": "One Voice access in Package Obligated",
    "businessDefinition": "One Voice access in Package obligated.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"Voice Access\" (FN156), THEN the target item is marked as [Eql(1)].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN156",
        "name": "Voice Access",
        "parentName": "Voice"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000168": {
    "ruleId": "CR000168",
    "ruleName": "Technology LTE obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"LTE Package\" (FN77), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN77: LTE Package\"",
      "Line technology check: 3600, null, \"NGN-4G\", \"GRUEN\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000171": {
    "ruleId": "CR000171",
    "ruleName": "No Downgrade from V1206TO Mobile & International Flat in Minimum Duration",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.productInMinimumDuration(\"V1206TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.203Z"
  },
  "CR000191": {
    "ruleId": "CR000191",
    "ruleName": "Not Allow Rule for Promotions in case of a Downgrade",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"fibreInternetConfiguration\" (FN219), \"adslInternetConfiguration\" (FN218), \"Fibre Package FIBRE\" (FN186), THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0505",
        "name": "GigaZuhause Basic Glasfaser",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0473",
        "name": "GigaZuhause Glasfaser",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN174",
        "name": "Promo2016_NoDowngrade",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasTariffWithContractValue(\"<\") AND cart.packageContainsInstalledBaseCategory(\"FN219: fibreInternetConfiguration\")",
      "cart.package.hasTariffWithContractValue(\"<\") AND cart.packageContainsInstalledBaseCategory(\"FN218: adslInternetConfiguration\")",
      "Package includes item in \"FN186: Fibre Package FIBRE\" AND cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\")",
      "Package includes item in \"FN0505: GigaZuhause Basic Glasfaser\" AND cart.packageContainedInstalledBaseCategory(\"FN0473: GigaZuhause Glasfaser\")",
      "Package includes item in \"FN76: DSL Package\" AND cart.packageContainsInstalledBaseCategory(\"FN219: fibreInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000193": {
    "ruleId": "CR000193",
    "ruleName": "Not Allow Rules for Promotions not allowed for current portfolio",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Fibre Package FIBRE\" (FN186), \"Promo2016_NotAllowed\" (FN176), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN176",
        "name": "Promo2016_NotAllowed",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasTariffWithVersion(\">=\")",
      "Package includes item in \"FN76: DSL Package\" OR Package includes item in \"FN186: Fibre Package FIBRE\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000198": {
    "ruleId": "CR000198",
    "ruleName": "ILSBLU Technology NGN-VDSL obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-395).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Bandwidth 1000\" (FN81), \"Bandwidth 2000\" (FN82), \"Bandwidth 6000\" (FN83), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-395 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN81",
        "name": "Bandwidth 1000",
        "parentName": "Internet"
      },
      {
        "id": "FN82",
        "name": "Bandwidth 2000",
        "parentName": "Internet"
      },
      {
        "id": "FN83",
        "name": "Bandwidth 6000",
        "parentName": "Internet"
      },
      {
        "id": "FN84",
        "name": "Bandwidth 16000",
        "parentName": "Internet"
      },
      {
        "id": "FN85",
        "name": "Bandwidth 25000",
        "parentName": "Internet"
      },
      {
        "id": "FN86",
        "name": "Bandwidth 50000",
        "parentName": "Internet"
      },
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN119",
        "name": "Bandwidth 100000",
        "parentName": "Internet"
      },
      {
        "id": "FN197",
        "name": "Bandwidth 175000",
        "parentName": "Internet"
      },
      {
        "id": "FN198",
        "name": "Bandwidth 250000",
        "parentName": "Internet"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")",
      "( Package includes item in \"FN81: Bandwidth 1000\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN82: Bandwidth 2000\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN83: Bandwidth 6000\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") ) OR ( availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") AND Cart contains item in \"FN84: Bandwidth 16000\" ) OR ( availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") AND Cart contains item in \"FN85: Bandwidth 25000\" ) OR ( availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") AND Cart contains item in \"FN86: Bandwidth 50000\" AND !Package includes item in \"FN77: LTE Package\" ) OR ( availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") AND Cart contains item in \"FN119: Bandwidth 100000\" ) OR ( Cart contains item in \"FN197: Bandwidth 175000\" AND availability.hasHighestPriority(175000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN198: Bandwidth 250000\" AND availability.hasHighestPriority(250000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-VDSL\", \"DSL\") )",
      "Package includes item in \"FN76: DSL Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000199": {
    "ruleId": "CR000199",
    "ruleName": "ILS: Technology NGN-DSL is obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Bandwidth 1000\" (FN81), \"Bandwidth 2000\" (FN82), \"Bandwidth 6000\" (FN83), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN81",
        "name": "Bandwidth 1000",
        "parentName": "Internet"
      },
      {
        "id": "FN82",
        "name": "Bandwidth 2000",
        "parentName": "Internet"
      },
      {
        "id": "FN83",
        "name": "Bandwidth 6000",
        "parentName": "Internet"
      },
      {
        "id": "FN84",
        "name": "Bandwidth 16000",
        "parentName": "Internet"
      },
      {
        "id": "FN85",
        "name": "Bandwidth 25000",
        "parentName": "Internet"
      },
      {
        "id": "FN86",
        "name": "Bandwidth 50000",
        "parentName": "Internet"
      },
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN119",
        "name": "Bandwidth 100000",
        "parentName": "Internet"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")",
      "( Package includes item in \"FN81: Bandwidth 1000\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-DSL\", \"DSL\") ) OR ( Cart contains item in \"FN82: Bandwidth 2000\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-DSL\", \"DSL\") ) OR ( Cart contains item in \"FN83: Bandwidth 6000\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-DSL\", \"DSL\") ) OR ( Cart contains item in \"FN84: Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-DSL\", \"DSL\") ) OR ( Cart contains item in \"FN85: Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-DSL\", \"DSL\") ) OR ( Cart contains item in \"FN86: Bandwidth 50000\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-DSL\", \"DSL\") AND !Package includes item in \"FN77: LTE Package\" ) OR ( Cart contains item in \"FN119: Bandwidth 100000\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"NGN-DSL\", \"DSL\") )",
      "Package includes item in \"FN76: DSL Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000200": {
    "ruleId": "CR000200",
    "ruleName": "ILS: Technology IP-Bitstream is obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-395).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Bandwidth 1000\" (FN81), \"Bandwidth 2000\" (FN82), \"Bandwidth 6000\" (FN83), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-395 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN81",
        "name": "Bandwidth 1000",
        "parentName": "Internet"
      },
      {
        "id": "FN82",
        "name": "Bandwidth 2000",
        "parentName": "Internet"
      },
      {
        "id": "FN83",
        "name": "Bandwidth 6000",
        "parentName": "Internet"
      },
      {
        "id": "FN84",
        "name": "Bandwidth 16000",
        "parentName": "Internet"
      },
      {
        "id": "FN85",
        "name": "Bandwidth 25000",
        "parentName": "Internet"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN119",
        "name": "Bandwidth 100000",
        "parentName": "Internet"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")",
      "( Package includes item in \"FN81: Bandwidth 1000\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") ) OR ( Cart contains item in \"FN82: Bandwidth 2000\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") ) OR ( Cart contains item in \"FN83: Bandwidth 6000\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") ) OR ( Cart contains item in \"FN84: Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") ) OR ( Cart contains item in \"FN85: Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") ) OR ( Package includes item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") AND !Package includes item in \"FN77: LTE Package\" ) OR ( Cart contains item in \"FN119: Bandwidth 100000\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream\", \"DSL\") )",
      "Package includes item in \"FN76: DSL Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000201": {
    "ruleId": "CR000201",
    "ruleName": "ILS: Technology IP-Bitstream VDSL obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-395).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Bandwidth 1000\" (FN81), \"Bandwidth 2000\" (FN82), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-395 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN81",
        "name": "Bandwidth 1000",
        "parentName": "Internet"
      },
      {
        "id": "FN82",
        "name": "Bandwidth 2000",
        "parentName": "Internet"
      },
      {
        "id": "FN83",
        "name": "Bandwidth 6000",
        "parentName": "Internet"
      },
      {
        "id": "FN84",
        "name": "Bandwidth 16000",
        "parentName": "Internet"
      },
      {
        "id": "FN85",
        "name": "Bandwidth 25000",
        "parentName": "Internet"
      },
      {
        "id": "FN86",
        "name": "Bandwidth 50000",
        "parentName": "Internet"
      },
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN119",
        "name": "Bandwidth 100000",
        "parentName": "Internet"
      },
      {
        "id": "FN197",
        "name": "Bandwidth 175000",
        "parentName": "Internet"
      },
      {
        "id": "FN198",
        "name": "Bandwidth 250000",
        "parentName": "Internet"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")",
      "Package includes item in \"FN76: DSL Package\"",
      "( Package includes item in \"FN81: Bandwidth 1000\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN82: Bandwidth 2000\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN83: Bandwidth 6000\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN84: Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN85: Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN86: Bandwidth 50000\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") AND !Package includes item in \"FN77: LTE Package\" ) OR ( Cart contains item in \"FN119: Bandwidth 100000\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN197: Bandwidth 175000\" AND availability.hasHighestPriority(175000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN198: Bandwidth 250000\" AND availability.hasHighestPriority(250000, \"GRUEN,GRUEN_GRAU,GELB\", \"IP-Bitstream VDSL\", \"DSL\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000203": {
    "ruleId": "CR000203",
    "ruleName": "ILS: Technology IP-L2-BSA VDSL obligated v3",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-395).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Bandwidth 1000\" (FN81), \"Bandwidth 2000\" (FN82), \"Bandwidth 6000\" (FN83), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-395 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN81",
        "name": "Bandwidth 1000",
        "parentName": "Internet"
      },
      {
        "id": "FN82",
        "name": "Bandwidth 2000",
        "parentName": "Internet"
      },
      {
        "id": "FN83",
        "name": "Bandwidth 6000",
        "parentName": "Internet"
      },
      {
        "id": "FN84",
        "name": "Bandwidth 16000",
        "parentName": "Internet"
      },
      {
        "id": "FN85",
        "name": "Bandwidth 25000",
        "parentName": "Internet"
      },
      {
        "id": "FN86",
        "name": "Bandwidth 50000",
        "parentName": "Internet"
      },
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN119",
        "name": "Bandwidth 100000",
        "parentName": "Internet"
      },
      {
        "id": "FN197",
        "name": "Bandwidth 175000",
        "parentName": "Internet"
      },
      {
        "id": "FN198",
        "name": "Bandwidth 250000",
        "parentName": "Internet"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")",
      "( Package includes item in \"FN81: Bandwidth 1000\" AND availability.hasHighestPriority(1000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN82: Bandwidth 2000\" AND availability.hasHighestPriority(2000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN83: Bandwidth 6000\" AND availability.hasHighestPriority(6000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN84: Bandwidth 16000\" AND availability.hasHighestPriority(16000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN85: Bandwidth 25000\" AND availability.hasHighestPriority(25000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN86: Bandwidth 50000\" AND availability.hasHighestPriority(50000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") AND !Package includes item in \"FN77: LTE Package\" ) OR ( Cart contains item in \"FN119: Bandwidth 100000\" AND availability.hasHighestPriority(100000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN197: Bandwidth 175000\" AND availability.hasHighestPriority(175000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") ) OR ( Cart contains item in \"FN198: Bandwidth 250000\" AND availability.hasHighestPriority(250000, \"GRUEN,GRUEN_GRAU,GELB\", \"L2-BSA VDSL\", \"DSL\") )",
      "Package includes item in \"FN76: DSL Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000206": {
    "ruleId": "CR000206",
    "ruleName": "V0025 Not Allowed with V0026",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"V0025VBLC\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000210": {
    "ruleId": "CR000210",
    "ruleName": "V0026 Not Allowed with V0025",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"V0026VBLC\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000212": {
    "ruleId": "CR000212",
    "ruleName": "ILS: removal not allwed for LTE Package Components without Tariff Change",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Internet\" (FN43), \"Hardware\" (FN24), \"LTE Package\" (FN77), THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [
      {
        "id": "FN43",
        "name": "Internet",
        "parentName": "Options"
      },
      {
        "id": "FN24",
        "name": "Hardware",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN31",
        "name": "Internet Access Technology",
        "parentName": "Technlogy Configuration"
      },
      {
        "id": "FN156",
        "name": "Voice Access",
        "parentName": "Voice"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageCreationTypeId(\"LTE\")",
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000213": {
    "ruleId": "CR000213",
    "ruleName": "Allow Access Technology ISDN if ISDN is in cart and no Tariff Change",
    "businessDefinition": "Allow AccessTechnology ISDN if ISDN is in cart and no TariffChange.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false",
      "Cart contains product \"ISDN-DSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000223": {
    "ruleId": "CR000223",
    "ruleName": "Accessories allowed for Sales Package",
    "businessDefinition": "Accessory allowed for Sales Package.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"subsidized\" (FN200), \"Accessory\" (FN169), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN200",
        "name": "subsidized",
        "parentName": "Payment Mode"
      },
      {
        "id": "FN169",
        "name": "Accessory",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ACQ\")",
      "cart.package.hasProcessContext(\"ILSBLU\")",
      "cart.package.hasProcessContext(\"MIGCOC\")",
      "cart.package.hasProcessContext(\"MOVBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000225": {
    "ruleId": "CR000225",
    "ruleName": "ILS: Access Technology Allowed if Access Technology in cart and no package change done",
    "businessDefinition": "ILS: Access Technology allowed if Access Technology in cart and no package change done.",
    "plainLanguageIntent": "During [ILSBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Internet Access Technology\" (FN31), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN31",
        "name": "Internet Access Technology",
        "parentName": "Technlogy Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN31: Internet Access Technology\"",
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000227": {
    "ruleId": "CR000227",
    "ruleName": "Bundle: Voice Tariff Options not removable if Giga Kombi V0987TO seleted",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Voice Tariff Options\" (FN48), THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [
      {
        "id": "FN48",
        "name": "Voice Tariff Options",
        "parentName": "Voice"
      }
    ],
    "conditionsHumanReadable": [
      "Product.hasSKU(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000246": {
    "ruleId": "CR000246",
    "ruleName": "ILS: No Option booking allowed for Default package",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 2000, null, null, \"GRUEN\"",
      "!Line technology check: 2000, null, \"ISDN-DSL\", \"GRUEN\"",
      "Cart contains product \"R70.1000000129-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000254": {
    "ruleId": "CR000254",
    "ruleName": "ILS: Allow Red Internet and Phone 16 for Default package",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 16000\" (FN39), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN39",
        "name": "Package sellable with Bandwidth 16000",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 2000, null, null, \"GRUEN\"",
      "!Line technology check: 2000, null, \"ISDN-DSL\", \"GRUEN\"",
      "Cart contains product \"R70.1000000129-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000255": {
    "ruleId": "CR000255",
    "ruleName": "Removal of mandatory products is not allowed",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"Internet\" (FN43), \"Voice Access\" (FN156), THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN43",
        "name": "Internet",
        "parentName": "Options"
      },
      {
        "id": "FN156",
        "name": "Voice Access",
        "parentName": "Voice"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000256": {
    "ruleId": "CR000256",
    "ruleName": "Basic Allow Rule: Allow current promotion for all sales packages even for move",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.containsProductInProductFamily(\"FNFamily2\")",
      "cart.package.containsProductInProductFamily(\"FNFamily1\")",
      "cart.package.containsProductInProductFamily(\"FNFamily3\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000259": {
    "ruleId": "CR000259",
    "ruleName": "Sales Package at BB 175000 is allowed",
    "businessDefinition": "BB 175000 available then allow Sales Packages 250, if OXG is not available, or ILS already had this BB before..",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 175000 DSL\" (FN185), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN185",
        "name": "Package sellable with Bandwidth 175000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 175000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR Cart contains product \"V018U\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000262": {
    "ruleId": "CR000262",
    "ruleName": "ILS: Allow Red Internet and Phone 50 for Default package",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 25000, null, null, \"GRUEN\"",
      "Cart contains product \"R70.1000000129-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000263": {
    "ruleId": "CR000263",
    "ruleName": "ILS: Allow Red Internet and Phone 100 for Default package",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 100000 DSL\" (FN69), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 100000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN\"",
      "Cart contains product \"R70.1000000129-24\"",
      "!Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR cart.packageContainedInstalledBaseProduct(\"V018N\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000264": {
    "ruleId": "CR000264",
    "ruleName": "BB 250000 at SalesPackage DSL is obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-395).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-395 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\"",
      "Line technology check: 250000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000265": {
    "ruleId": "CR000265",
    "ruleName": "Fallback BB175000 at DSL Package250 is obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\"",
      "Line technology check: 175000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\" AND !Line technology check: 250000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000273": {
    "ruleId": "CR000273",
    "ruleName": "Other Flats cannot be booked if Euro Flat is in the cart",
    "businessDefinition": "Other Flats cannot be booked if Euro-Flat is in the cart.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"V1204TO\"",
      "!Cart contains product \"V1200TO\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000274": {
    "ruleId": "CR000274",
    "ruleName": "Euro-Flat cannot be booked if Vodafone-Flat is in the cart",
    "businessDefinition": "Euro-Flat cannot be booked if Vodafone-Flat is in the cart.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Cart contains product \"V1204TO\"",
      "Cart contains product \"V1200TO\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000278": {
    "ruleId": "CR000278",
    "ruleName": "Default ISDN in case or Portfolio 2016 and not other access in Cart",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"Internet NGN\" (FN142), \"Internet Bitstream\" (FN143), \"Internet LTE\" (FN144), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN142",
        "name": "Internet NGN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN143",
        "name": "Internet Bitstream",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN144",
        "name": "Internet LTE",
        "parentName": "Internet Access Technology"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false",
      "cart.package.hasProductWithVersion(\"R708.2000000019-24\", \"equals\")",
      "!Cart contains item in \"FN142: Internet NGN\"",
      "!Cart contains item in \"FN143: Internet Bitstream\"",
      "!Cart contains item in \"FN144: Internet LTE\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.204Z"
  },
  "CR000279": {
    "ruleId": "CR000279",
    "ruleName": "ADSL rental Hardware allowed if cart contains ADSL ",
    "businessDefinition": "ADSL rental Hardware allowed if cart contains Internet ADSL.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"ADSL AccessTechnology\" (FN222), \"Rental_AccessHW\" (FN178), \"ADSL\" (FN138), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN222",
        "name": "ADSL AccessTechnology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN222: ADSL AccessTechnology\"",
      "cart.package.tariffInMinimumDuration() equals false OR !Customer already owns item in \"FN178: Rental_AccessHW\" OR !Customer already owns item in \"FN138: ADSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000280": {
    "ruleId": "CR000280",
    "ruleName": "VDSL rental Hardware allowed if cart contains VDSL",
    "businessDefinition": "VDSL rental Hardware allowed if cart contains Internet VDSL.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"VDSL Access Technology\" (FN223), \"Package sellable with Bandwidth 250000 DSL\" (FN183), \"Rental_AccessHW\" (FN178), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN223",
        "name": "VDSL Access Technology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN223: VDSL Access Technology\"",
      "!Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\"",
      "cart.package.tariffInMinimumDuration() equals false OR !Customer already owns item in \"FN178: Rental_AccessHW\" OR !Customer already owns item in \"FN137: VDSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000281": {
    "ruleId": "CR000281",
    "ruleName": "VDSL-Vectoring rental Hardware allowed if cart contains Red I&P 250",
    "businessDefinition": "VDSL-Vectoring rental Hardware allowed if cart contains Red I&P 250.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 250000 DSL\" (FN183), \"Rental_AccessHW\" (FN178), \"VDSL Vectoring\" (FN132), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\"",
      "cart.package.tariffInMinimumDuration() equals false OR !Customer already owns item in \"FN178: Rental_AccessHW\" OR !Customer already owns item in \"FN132: VDSL Vectoring\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000282": {
    "ruleId": "CR000282",
    "ruleName": "ILS: Allow ISDN voice SKUs in Portfolio 2016",
    "businessDefinition": "ILS: Allow ISDN voice skus in Portfolio 2016.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Internet ISDN\" (FN141), \"Voice ISDN\" (FN27), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN141",
        "name": "Internet ISDN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN27",
        "name": "Voice ISDN",
        "parentName": "Voice Access Technology"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN141: Internet ISDN\"",
      "cart.package.hasProductWithVersion(\"R708.2000000019-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000287": {
    "ruleId": "CR000287",
    "ruleName": "ILS: Do not allow legacy products",
    "businessDefinition": "ILS: not allow legacy products.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000290": {
    "ruleId": "CR000290",
    "ruleName": "ILS: Allow installedBase products if Tariff change not done",
    "businessDefinition": "ILS: Allow installedBase products if Tariff change not done.",
    "plainLanguageIntent": "During [ILSBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000296": {
    "ruleId": "CR000296",
    "ruleName": "ILS: removal not allowed legacy BB if Tariff change not done",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000297": {
    "ruleId": "CR000297",
    "ruleName": "ILS: removal not allowed legacy Voice Access if Tariff change not done",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000305": {
    "ruleId": "CR000305",
    "ruleName": "Allow existing legacy safety packages of customer during Tariff Change",
    "businessDefinition": "Allow existing legacy safety packages of customer during Tariff Change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Security Package\" (FN45), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN45",
        "name": "Security Package",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000307": {
    "ruleId": "CR000307",
    "ruleName": "Allow existing legacy Accessories of customer during Tariff Change",
    "businessDefinition": "Allow existing legacy Accessories of customer during Tariff Change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000309": {
    "ruleId": "CR000309",
    "ruleName": "Allow existing legacy Fees of customer during Tariff Change",
    "businessDefinition": "Allow existing legacy Fees of customer during Tariff Change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Fee\" (FN25), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN25",
        "name": "Fee",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000312": {
    "ruleId": "CR000312",
    "ruleName": "Standard Basic Access is defaulted if cart does not contain certain HW or ILS Basic",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Sales Package\" (FN20), \"Hardware for Komfort-Goody\" (FN0525), \"Basic Access\" (FN78), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN0525",
        "name": "Hardware for Komfort-Goody",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN78",
        "name": "Basic Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\" AND !Cart contains item in \"FN0525: Hardware for Komfort-Goody\" AND ( cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") )",
      "Cart contains item in \"FN20: Sales Package\" AND cart.package.isTariffChanged() equals true AND Customer already owns item in \"FN78: Basic Access\" AND ( cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.hasProcessContext(\"MOVBLU\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000313": {
    "ruleId": "CR000313",
    "ruleName": "Standard premium allowed if current SalesPackage and no 20090149 in cart",
    "businessDefinition": "Standard premium allowed if current SalesPackage and not 20090149 in cart 17.04.2024 allow voice premium without any hardware precondition,.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Sales Package\" (FN20), \"Basic Access\" (FN78), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN78",
        "name": "Basic Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\" AND !cart.packageContainsProduct(\"R708.2000000000-24\") AND ( cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"MOVBLU\") )",
      "Cart contains item in \"FN20: Sales Package\" AND cart.package.hasProcessContext(\"ILSBLU\") AND !cart.packageContainsProduct(\"R708.2000000000-24\") AND ( cart.packageContainsInstalledBaseCategory(\"FN78: Basic Access\": Basic Access\") OR cart.packageContainedInstalledBaseCategory(\"FN78: Basic Access\": Basic Access\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000314": {
    "ruleId": "CR000314",
    "ruleName": "Standard premium Access is defaulted",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Sales Package\" (FN20), \"Hardware for Komfort-Goody\" (FN0525), \"Comfort Access\" (FN79), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN0525",
        "name": "Hardware for Komfort-Goody",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\" AND !cart.packageContainsProduct(\"R708.2000000000-24\") AND Cart contains item in \"FN0525: Hardware for Komfort-Goody\" AND ( cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"ACQ\") )",
      "( cart.packageContainsNewProduct(\"20090217_sub\") OR cart.packageContainsNewProduct(\"20090216_sub\") ) AND ( cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.hasProcessContext(\"MOVBLU\") )",
      "cart.package.isTariffChanged() equals true AND !cart.packageContainsProduct(\"R708.2000000000-24\") AND Customer already owns item in \"FN79: Comfort Access\" AND !cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\") AND ( cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.hasProcessContext(\"MOVBLU\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000315": {
    "ruleId": "CR000315",
    "ruleName": "Standard basic access allowed if certain hardware is in the cart",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Sales Package\" (FN20), \"Hardware for Komfort-Goody\" (FN0525), \"DSL Package\" (FN76), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN0525",
        "name": "Hardware for Komfort-Goody",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      },
      {
        "id": "FN0527",
        "name": "current hardware for Komfort Goody",
        "parentName": "Hardware for Komfort-Goody"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\" AND ( cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR Cart contains item in \"FN0525: Hardware for Komfort-Goody\" OR cart.package.hasProcessContext(\"MOVBLU\") )",
      "cart.package.hasProcessContext(\"ILSBLU\") AND ( Package includes item in \"FN76: DSL Package\" OR Package includes item in \"FN186: Fibre Package FIBRE\" ) AND ( cart.packageContainsInstalledBaseCategory(\"FN79: Comfort Access\": Comfort Access\") OR cart.packageContainedInstalledBaseCategory(\"FN79: Comfort Access\": Comfort Access\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000325": {
    "ruleId": "CR000325",
    "ruleName": "Sales Package at BB250000 DSL allowed (replace CRFN258)",
    "businessDefinition": "If BB 250000 available then allow Sales Packages 250 if OXG not exists or BB250 was in installedBase.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"FN258\" (FN258), \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN258",
        "name": "FN258",
        "parentName": null
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 250000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR Cart contains product \"V018V\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000326": {
    "ruleId": "CR000326",
    "ruleName": "Sales Package at BB 100000 DSL Allowed",
    "businessDefinition": "If BB 100000 available then alloq Sales Packages 100 if no OXG is available or BB100 is already in installedBase.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 100000 DSL\" (FN69), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 100000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "!Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") OR Cart contains product \"V018N\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000335": {
    "ruleId": "CR000335",
    "ruleName": "BB 500 Mbit at all 500-Mbit sales packages obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 500 Mbit Fibre\" (FN206), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN206",
        "name": "Package sellable with Bandwidth 500 Mbit Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(500000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\")",
      "Package includes item in \"FN206: Package sellable with Bandwidth 500 Mbit Fibre\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR ( cart.package.isTariffChanged() equals true AND cart.package.hasProcessContext(\"ILSBLU\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000336": {
    "ruleId": "CR000336",
    "ruleName": "BB 750 Mbit at all 750-Mbit sales packages obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 750 Mbit Fibre\" (FN207), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN207",
        "name": "Package sellable with Bandwidth 750 Mbit Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(750000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\")",
      "Package includes item in \"FN207: Package sellable with Bandwidth 750 Mbit Fibre\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR ( cart.package.isTariffChanged() equals true AND cart.package.hasProcessContext(\"ILSBLU\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000337": {
    "ruleId": "CR000337",
    "ruleName": "BB 1000 Mbit at all 1000Mbit sales packages obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-405).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 1000 Mbit Fibre\" (FN208), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-405 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN208",
        "name": "Package sellable with Bandwidth 1000 Mbit Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-GPON\", \"FIBRE\")",
      "Package includes item in \"FN208: Package sellable with Bandwidth 1000 Mbit Fibre\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000338": {
    "ruleId": "CR000338",
    "ruleName": "FTTH-GPON is Obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Fibre Package GPON\" (FN0507), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-GPON\", \"FIBRE\")",
      "Package includes item in \"FN0507: Fibre Package GPON\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000341": {
    "ruleId": "CR000341",
    "ruleName": "Fiber Regio-Classification 00 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;00)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;00)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;00)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000342": {
    "ruleId": "CR000342",
    "ruleName": "Fiber Regio-Classification 01 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;01)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;01)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;01)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000343": {
    "ruleId": "CR000343",
    "ruleName": "Fiber Regio-Classification 02 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;02)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;02)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;02)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000345": {
    "ruleId": "CR000345",
    "ruleName": "Fiber Regio-Classification 03 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;03)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;03)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;03)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.205Z"
  },
  "CR000352": {
    "ruleId": "CR000352",
    "ruleName": "Fiber Regio-Classification 04 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;04)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;04)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;04)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000353": {
    "ruleId": "CR000353",
    "ruleName": "Fiber Regio-Classification 05 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;05)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;05)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;05)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000354": {
    "ruleId": "CR000354",
    "ruleName": "Fiber Regio-Classification 06 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;06)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;06)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;06)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000355": {
    "ruleId": "CR000355",
    "ruleName": "Fiber Regio-Classification 07 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;07)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;07)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;07)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000356": {
    "ruleId": "CR000356",
    "ruleName": "Fiber Regio-Classification 08 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;08)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;08)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;08)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000357": {
    "ruleId": "CR000357",
    "ruleName": "Fiber Regio-Classification 09 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true",
      "( Cart contains product \"FTTH-GPON\" AND availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(AREA_CLASSIFICATION;09)\") ) OR ( Cart contains product \"FTTH-L2-BSA\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(AREA_CLASSIFICATION;09)\") ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(AREA_CLASSIFICATION;09)\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000386": {
    "ruleId": "CR000386",
    "ruleName": "Allow GigaTV Net for 2Play packages",
    "businessDefinition": "Allow GigaTV Net for 2Play packages.",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (8 conditions) are satisfied involving Category \"Internet LTE\" (FN144), \"Bandwidth 6000\" (FN83), \"Bandwidth 2000\" (FN82), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN144",
        "name": "Internet LTE",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN83",
        "name": "Bandwidth 6000",
        "parentName": "Internet"
      },
      {
        "id": "FN82",
        "name": "Bandwidth 2000",
        "parentName": "Internet"
      },
      {
        "id": "FN81",
        "name": "Bandwidth 1000",
        "parentName": "Internet"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN144: Internet LTE\"",
      "customer.isSoho() equals false",
      "agent.hasPermission(\"ALLOW_CAB\")",
      "!Package includes item in \"FN83: Bandwidth 6000\"",
      "!Package includes item in \"FN82: Bandwidth 2000\"",
      "!Package includes item in \"FN81: Bandwidth 1000\"",
      "Cart contains item in \"FN20: Sales Package\"",
      "!Cart contains product 10018"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000387": {
    "ruleId": "CR000387",
    "ruleName": "BB 50000 at all DSL 50 packages obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-395).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-395 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")",
      "Package includes item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND Line technology check: 50000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000388": {
    "ruleId": "CR000388",
    "ruleName": "BB 100000 at all DSL-100000 obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira DSL-100000).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 100000 DSL\" (FN69), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira DSL-100000 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN69: Package sellable with Bandwidth 100000 DSL\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR000393": {
    "ruleId": "CR000393",
    "ruleName": "FRITZ!Box 7630 defaulted at Fiber GPON or at DG Package ",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"FIBRE\" (FN210), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;GFNW)\")",
      "Cart contains product \"FTTH-GPON\" OR Cart contains product \"FTTH-L2-BSA\"",
      "cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"ACQ\") OR ( cart.package.isTariffChanged() equals true AND !cart.packageContainsInstalledBaseCategory(\"FN210: FIBRE\") AND ( cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.hasProcessContext(\"MOVBLU\") ) )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005403": {
    "ruleId": "CR005403",
    "ruleName": "Installations Fee GPON obligated in case of GPON ACQ or technology change to GPON",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Fibre Package GPON\" (FN0507), \"adslInternetConfiguration\" (FN218), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-GPON\", \"FIBRE\")",
      "Package includes item in \"FN0507: Fibre Package GPON\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005428": {
    "ruleId": "CR005428",
    "ruleName": "Super WIFI Allow Super WLAN with compatible tariff in shopping cart",
    "businessDefinition": "All Super WLAN SKUs will be allowed in first step, in other rule they will be disallowed according to business needs..",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Internet ISDN\" (FN141), \"Super WLAN Options\" (FN0302), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN141",
        "name": "Internet ISDN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "!cart.packageContainsProduct(\"R708.2000000000-24\")",
      "!Cart contains item in \"FN141: Internet ISDN\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005434": {
    "ruleId": "CR005434",
    "ruleName": "LZ Option obligated with SuperWLAN Extender (additional)",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Super WLAN additional Extender\" (FN0312), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0312",
        "name": "Super WLAN additional Extender",
        "parentName": "Super WLAN Extender"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0312: Super WLAN additional Extender\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005447": {
    "ruleId": "CR005447",
    "ruleName": "Contract Prolongation not allowed with tariff change or old portfolio",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"<\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005450": {
    "ruleId": "CR005450",
    "ruleName": "Not Allow Rule Downgrade Fee in case of Stay or Winback",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Internet FTTH-GPON\" (FN220), \"adslInternetConfiguration\" (FN218), \"Fibre Package FIBRE\" (FN186), THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN220",
        "name": "Internet FTTH-GPON",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN0325",
        "name": "Downgrade Fee",
        "parentName": "Fee"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product 10007 OR Cart contains product 10009",
      "( cart.package.hasTariffWithContractValue(\"<\") AND cart.packageContainsInstalledBaseCategory(\"FN220: Internet FTTH-GPON\") ) OR ( cart.package.hasTariffWithContractValue(\"<\") AND cart.packageContainsInstalledBaseCategory(\"FN218: adslInternetConfiguration\": adslInternetConfiguration\") ) OR ( Package includes item in \"FN186: Fibre Package FIBRE\" AND cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\": adslInternetConfiguration\") ) OR ( Package includes item in \"FN76: DSL Package\" AND cart.packageContainedInstalledBaseCategory(\"FN219: fibreInternetConfiguration\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005452": {
    "ruleId": "CR005452",
    "ruleName": "Not Allow 12 and 24 months promo in case of no contract prolongation_redesign",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"24 Months - Hardware\" (FN0351), \"12 Months - Hardware\" (FN0349), \"24 months\" (FN0578), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0351",
        "name": "24 Months - Hardware",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0349",
        "name": "12 Months - Hardware",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0578",
        "name": "24 months",
        "parentName": "Promo_stay_winback_duration"
      },
      {
        "id": "FN0576",
        "name": "12 months",
        "parentName": "Promo_stay_winback_duration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R708.2000000000-24\"",
      "cart.package.isTariffChanged() equals false AND !Cart contains product 10010"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005456": {
    "ruleId": "CR005456",
    "ruleName": "not allow all 24 months Winback promos if no 24 months tariff in cart",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"24 Months packages\" (FN0355), \"24 Months - Hardware\" (FN0351), \"24 months\" (FN0578), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0355",
        "name": "24 Months packages",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0351",
        "name": "24 Months - Hardware",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0578",
        "name": "24 months",
        "parentName": "Promo_stay_winback_duration"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN0355: 24 Months packages\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005458": {
    "ruleId": "CR005458",
    "ruleName": "Winback, Stay and Prolongation allowed with NBA_Indicator",
    "businessDefinition": "allow Winback, stay and Prolongation with NBA_INDICATOR.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Winback and Prolongation\" (FN0319), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0319",
        "name": "Winback and Prolongation",
        "parentName": "FN_Package Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsNBAIndicator(\"winback\")",
      "cart.containsNBAIndicator(\"stay\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005460": {
    "ruleId": "CR005460",
    "ruleName": "Do not allow Stay promos without stay or with friendsFamily in shopping cart_redesign",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"fibreInternetConfiguration\" (FN219), \"Promo_stay_redesign\" (FN0568), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN0568",
        "name": "Promo_stay_redesign",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains product 10009",
      "Package includes item in \"FN219: fibreInternetConfiguration\"",
      "Cart contains product \"GS_Friends_5E[br]EOL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005491": {
    "ruleId": "CR005491",
    "ruleName": "Do not allow winback promos without Winback or with FriendsFamily in shopping cart_redesign",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Promo_winback_redesign\" (FN0560), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0560",
        "name": "Promo_winback_redesign",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains product 10007",
      "Cart contains product \"GS_Friends_5E[br]EOL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005493": {
    "ruleId": "CR005493",
    "ruleName": "not allow more than Winback 5 promo in case of no DoublePlay package",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Double Play Package\" (FN74), \"24 Months Packages Expired\" (FN0521), \"24 Months - Hardware\" (FN0351), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN74",
        "name": "Double Play Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0521",
        "name": "24 Months Packages Expired",
        "parentName": "24 Months packages"
      },
      {
        "id": "FN0351",
        "name": "24 Months - Hardware",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0349",
        "name": "12 Months - Hardware",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0578",
        "name": "24 months",
        "parentName": "Promo_stay_winback_duration"
      },
      {
        "id": "FN0576",
        "name": "12 months",
        "parentName": "Promo_stay_winback_duration"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN74: Double Play Package\"",
      "Package includes item in \"FN0521: 24 Months Packages Expired\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005495": {
    "ruleId": "CR005495",
    "ruleName": "Nnot allow stay promos retail",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Promo_stay_redesign\" (FN0568), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0568",
        "name": "Promo_stay_redesign",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ACQ\")",
      "cart.package.hasProcessContext(\"ILSBLU\")",
      "cart.package.hasProcessContext(\"MIGCOC\")",
      "cart.package.hasProcessContext(\"MOVBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005497": {
    "ruleId": "CR005497",
    "ruleName": "not allow hardware Large promos in case of winback or stay promo more than 7_50",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Promo_10\" (FN0572), \"Promo_10\" (FN0564), \"Promo more than 10\" (FN0566), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0572",
        "name": "Promo_10",
        "parentName": "Promo_stay_redesign"
      },
      {
        "id": "FN0564",
        "name": "Promo_10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0566",
        "name": "Promo more than 10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0395",
        "name": "Large Hardware 24",
        "parentName": "24 Months - Hardware"
      },
      {
        "id": "FN0391",
        "name": "Large Hardware 12",
        "parentName": "12 Months - Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN0572: Promo_10\"",
      "Cart contains item in \"FN0564: Promo_10\"",
      "Cart contains item in \"FN0566: Promo more than 10\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005523": {
    "ruleId": "CR005523",
    "ruleName": "Downgrade Fee in case of Tariff downgrade same portfolio no Wechselgarantie",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (7 conditions) are satisfied involving Category \"Wechselgarantie 12 month packages DSL - used for old portfolio\" (FN0548), \"Wechselgarantie 12 month packages GPON\" (FN0550), \"Wechselgarantie 18 month packages Wholebuy\" (FN0544), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0548",
        "name": "Wechselgarantie 12 month packages DSL - used for old portfolio",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0550",
        "name": "Wechselgarantie 12 month packages GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0544",
        "name": "Wechselgarantie 18 month packages Wholebuy",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0639",
        "name": "Wechselgarantie 18 month packages DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasTariffWithContractValue(\"<\")",
      "!Cart contains product 10007",
      "!Cart contains product 10009",
      "!Cart contains item in \"FN0548: Wechselgarantie 12 month packages DSL - used for old portfolio\"",
      "!Cart contains item in \"FN0550: Wechselgarantie 12 month packages GPON\"",
      "!Cart contains item in \"FN0544: Wechselgarantie 18 month packages Wholebuy\"",
      "!Package includes item in \"FN0639: Wechselgarantie 18 month packages DSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005525": {
    "ruleId": "CR005525",
    "ruleName": "not allow 1.99E promos if no 1.99E Hardware in shopping cart",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"1_99 Box\" (FN0373), \"Access Hardware\" (FN158), \"Hardware 1_99 Promo\" (FN0411), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0373",
        "name": "1_99 Box",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN0411",
        "name": "Hardware 1_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN0373: 1_99 Box\"",
      "Cart contains product 10009 AND !New item added in \"FN158: Access Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.206Z"
  },
  "CR005527": {
    "ruleId": "CR005527",
    "ruleName": "not allow 2.99E promos if no 2.99E Hardware in shopping cart",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"2_99 Box\" (FN0375), \"Access Hardware\" (FN158), \"Hardware 2_99 Promo\" (FN0413), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0375",
        "name": "2_99 Box",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN0413",
        "name": "Hardware 2_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN0375: 2_99 Box\"",
      "Cart contains product 10009 AND !New item added in \"FN158: Access Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005529": {
    "ruleId": "CR005529",
    "ruleName": "not allow 4.99E promos if no 4.99E Hardware in shopping cart",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"4_99 Box\" (FN0377), \"Access Hardware\" (FN158), \"Hardware 4_99 Promo\" (FN0415), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0377",
        "name": "4_99 Box",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN0415",
        "name": "Hardware 4_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN0377: 4_99 Box\"",
      "Cart contains product 10009 AND !New item added in \"FN158: Access Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005531": {
    "ruleId": "CR005531",
    "ruleName": "not allow 5.99E promos if no 5.99E Hardware in shopping cart",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"5_99 Box\" (FN0379), \"Access Hardware\" (FN158), \"Hardware 5_99 Promo\" (FN0417), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0379",
        "name": "5_99 Box",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN0417",
        "name": "Hardware 5_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN0379: 5_99 Box\"",
      "Cart contains product 10009 AND !New item added in \"FN158: Access Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005533": {
    "ruleId": "CR005533",
    "ruleName": "Do not allow hardware winback promos",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Promo_WinbackStay_Hardware\" (FN0347), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0347",
        "name": "Promo_WinbackStay_Hardware",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains product 10007",
      "!Cart contains product 10009"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005537": {
    "ruleId": "CR005537",
    "ruleName": "Online Angebot: 6 Monate no Basispreis",
    "businessDefinition": "6 Monate kein Basispreis für Red Internet & Phone DSL 50000.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Cart contains product \"R708.2000000017-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005539": {
    "ruleId": "CR005539",
    "ruleName": "Online Angebot  6 Monate kein Basispreis",
    "businessDefinition": "6 Monate kein Basispreis für Red Internet & Phone DSL 100000.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Cart contains product \"R708.2000000019-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005541": {
    "ruleId": "CR005541",
    "ruleName": "Online Angebot: 6 Monate No Basis_preis",
    "businessDefinition": "6 Monate kein Basispreis für Red Internet & Phone DSL 250000.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Cart contains product \"R708.2000000020-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005543": {
    "ruleId": "CR005543",
    "ruleName": "not allow Attack Promos for ILSBLU",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Attack_Promo\" (FN0419), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0419",
        "name": "Attack_Promo",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005555": {
    "ruleId": "CR005555",
    "ruleName": "ILS: HW not allowed for new DSL contracts",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Hardware not allowed for ACQ\" (FN0421), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0421",
        "name": "Hardware not allowed for ACQ",
        "parentName": "Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ACQ\")",
      "cart.package.hasProcessContext(\"ILSBLU\")",
      "cart.package.hasProcessContext(\"MIGCOC\")",
      "cart.package.hasProcessContext(\"MOVBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005557": {
    "ruleId": "CR005557",
    "ruleName": "Allow GigaKombi Haushalt with compatible DSL Package",
    "businessDefinition": "Allow GigaKombi Haushalt with compatible DSL Package.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"DSL_total\" (FN155), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN155",
        "name": "DSL_total",
        "parentName": "FN_Bundle Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains product \"V0987TO\"",
      "Cart contains item in \"FN155: DSL_total\"",
      "!cart.containsProductInCategoryName(\"Bundle->Mobile_total\")",
      "!Cart contains product \"VGK01TO\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005561": {
    "ruleId": "CR005561",
    "ruleName": "not allow 6.99E promos if no 6.99E Hardware in shopping cart",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"6_99 Box\" (FN0425), \"Access Hardware\" (FN158), \"Hardware 6_99 Promo\" (FN0423), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0425",
        "name": "6_99 Box",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN0423",
        "name": "Hardware 6_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN0425: 6_99 Box\"",
      "Cart contains product 10009 AND !New item added in \"FN158: Access Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005570": {
    "ruleId": "CR005570",
    "ruleName": "One Bandwidth SKU obligated",
    "businessDefinition": "One bandwidth SKU obligated.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"Internet\" (FN43), THEN the target item is marked as [Eql(1)].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN43",
        "name": "Internet",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005572": {
    "ruleId": "CR005572",
    "ruleName": "allow product no shipping costs 10013 in Winback or Stay",
    "businessDefinition": "Shipping costs can be suppressed in case of winback or stay.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product 10004",
      "cart.containsNBAIndicator(\"winback\") OR cart.containsNBAIndicator(\"stay\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005576": {
    "ruleId": "CR005576",
    "ruleName": "ILS: Maximum One Rental HW in cart",
    "businessDefinition": "ILS: Maximum one rental HW in cart. Necessary in case of winback, because it allows changing HW even if current HW is compatible. Rule should hinder agent from selling more than 1 access Hardware..",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"Rental_AccessHW\" (FN178), THEN the target item is marked as [MAX(1)].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "MAX(1)",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005580": {
    "ruleId": "CR005580",
    "ruleName": "ILS: not allow legacy Voice Options",
    "businessDefinition": "ILS: not allow legacy voice options.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Voice Tariff Options\" (FN48), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN48",
        "name": "Voice Tariff Options",
        "parentName": "Voice"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005584": {
    "ruleId": "CR005584",
    "ruleName": "Experten Service Einrichtung",
    "businessDefinition": "Experten Service Einrichtung (V0342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Internet NGN\" (FN142), \"Internet Bitstream\" (FN143), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN142",
        "name": "Internet NGN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN143",
        "name": "Internet Bitstream",
        "parentName": "Internet Access Technology"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR ( ( Cart contains item in \"FN142: Internet NGN\": Internet NGN\" AND !cart.packageContainsInstalledBaseCategory(\"FN142: Internet NGN\": Internet NGN\") ) OR ( Package includes item in \"FN143: Internet Bitstream\": Internet Bitstream\" AND !cart.packageContainsInstalledBaseCategory(\"FN143: Internet Bitstream\": Internet Bitstream\") ) )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005586": {
    "ruleId": "CR005586",
    "ruleName": "Experten Service Glasfaser GPON",
    "businessDefinition": "Experten Service Glasfaser (V0343) nur für GF GPON.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Fibre Package GPON\" (FN0507), \"adslInternetConfiguration\" (FN218), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-GPON\", \"FIBRE\")",
      "Package includes item in \"FN0507: Fibre Package GPON\"",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005588": {
    "ruleId": "CR005588",
    "ruleName": "Experten Service Optimierung",
    "businessDefinition": "Experten Service Optimierung (V0344).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"Internet ISDN\" (FN141), \"Internet NGN\" (FN142), \"Internet Bitstream\" (FN143), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN141",
        "name": "Internet ISDN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN142",
        "name": "Internet NGN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN143",
        "name": "Internet Bitstream",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN144",
        "name": "Internet LTE",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN220",
        "name": "Internet FTTH-GPON",
        "parentName": "Internet Access Technology"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainsInstalledBaseCategory(\"FN141: Internet ISDN\")",
      "cart.packageContainsInstalledBaseCategory(\"FN142: Internet NGN\")",
      "cart.packageContainsInstalledBaseCategory(\"FN143: Internet Bitstream\")",
      "cart.packageContainsInstalledBaseCategory(\"FN144: Internet LTE\")",
      "cart.packageContainsInstalledBaseCategory(\"FN220: Internet FTTH-GPON\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005598": {
    "ruleId": "CR005598",
    "ruleName": "allow Tuniberg-Promo for GigaGemeinde 2Play packages",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 Fibre\" (FN211), \"Fibre Package GPON\" (FN0507), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN211",
        "name": "Package sellable with Bandwidth 50000 Fibre",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.containsProductInProductFamily(\"FNFamily2\")",
      "!Cart contains item in \"FN211: Package sellable with Bandwidth 50000 Fibre\"",
      "Package includes item in \"FN0507: Fibre Package GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005622": {
    "ruleId": "CR005622",
    "ruleName": "Default DelightService in case of winback",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.containsNBAIndicator(\"winback\")",
      "cart.containsNBAIndicator(\"stay\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005655": {
    "ruleId": "CR005655",
    "ruleName": "GS_dsltreuerabatt_2.50Eu(br) not allowed without NBA Indicator or in case of no upsell",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "installBase.containsProduct(\"GS_dsltreuerabatt_2_50Eu(br)\")",
      "cart.containsNBAIndicator(\"GS_dsltreuerabatt_2_50E\") AND cart.package.hasTariffWithContractValue(\">\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005663": {
    "ruleId": "CR005663",
    "ruleName": "AVM Repeater is only allowed with AVM-Router",
    "businessDefinition": "Fritz!Box/Eigenhardware Kunde can be sold in case of new contract only together with Fritz!Box Repeater.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"ownHardware\" (FN0519), \"FRITZ!box\" (FN114), \"AVM Repeater\" (FN0447), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0519",
        "name": "ownHardware",
        "parentName": "Payment Mode"
      },
      {
        "id": "FN114",
        "name": "FRITZ!box",
        "parentName": "HW Label"
      },
      {
        "id": "FN0447",
        "name": "AVM Repeater",
        "parentName": "Accessory"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R708.2000000000-24\"",
      "!Cart contains item in \"FN0519: ownHardware\" AND !Package includes item in \"FN114: FRITZ!box\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005665": {
    "ruleId": "CR005665",
    "ruleName": "Winback: Promos more than 7_50 not allowed with Hardware Promo 4_99_redesign",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Hardware 4_99 Promo\" (FN0415), \"Promo_10\" (FN0572), \"Promo_10\" (FN0564), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0415",
        "name": "Hardware 4_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0572",
        "name": "Promo_10",
        "parentName": "Promo_stay_redesign"
      },
      {
        "id": "FN0564",
        "name": "Promo_10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0566",
        "name": "Promo more than 10",
        "parentName": "Promo_winback_redesign"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0415: Hardware 4_99 Promo\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005667": {
    "ruleId": "CR005667",
    "ruleName": "Winback: Promos more than 5 not allowed with Hardware Promo higher than 4_99",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Hardware 6_99 Promo\" (FN0423), \"Hardware 5_99 Promo\" (FN0417), \"Promo_10\" (FN0572), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0423",
        "name": "Hardware 6_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0417",
        "name": "Hardware 5_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0572",
        "name": "Promo_10",
        "parentName": "Promo_stay_redesign"
      },
      {
        "id": "FN0564",
        "name": "Promo_10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0566",
        "name": "Promo more than 10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0580",
        "name": "Promo_7_50",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0582",
        "name": "Promo_7_50",
        "parentName": "Promo_stay_redesign"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN0423: Hardware 6_99 Promo\"",
      "Package includes item in \"FN0417: Hardware 5_99 Promo\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005671": {
    "ruleId": "CR005671",
    "ruleName": "only superWlan compatible hardware allowed with SW010",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Super WLAN Options\" (FN0302), \"NOT Super WLAN ready\" (FN0449), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      },
      {
        "id": "FN0449",
        "name": "NOT Super WLAN ready",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN0302: Super WLAN Options\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005673": {
    "ruleId": "CR005673",
    "ruleName": "unsub Hardware not allowed for new Contracts or Winback or TechChange",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"Fibre Package FIBRE\" (FN186), \"adslInternetConfiguration\" (FN218), \"Access Hardware\" (FN158), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN201",
        "name": "unsubsidized",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ACQ\")",
      "cart.package.hasProcessContext(\"MIGCOC\")",
      "Cart contains product 10007",
      "Cart contains product 10009",
      "Package includes item in \"FN186: Fibre Package FIBRE\" AND cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005675": {
    "ruleId": "CR005675",
    "ruleName": "unsub hardware not allowed for not compatible hardware",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (8 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), \"VDSL Vectoring\" (FN132), \"VDSL Access Technology\" (FN223), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN223",
        "name": "VDSL Access Technology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN222",
        "name": "ADSL AccessTechnology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN220",
        "name": "Internet FTTH-GPON",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      },
      {
        "id": "FN0300",
        "name": "Super WLAN ready",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN201",
        "name": "unsubsidized",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) AND !Customer already owns item in \"FN132: VDSL Vectoring\"",
      "Cart contains item in \"FN223: VDSL Access Technology\" AND !Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Customer already owns item in \"FN137: VDSL\"",
      "Cart contains item in \"FN222: ADSL AccessTechnology\" AND !Customer already owns item in \"FN138: ADSL\"",
      "!Customer already owns item in \"FN210: FIBRE\" AND Cart contains item in \"FN220: Internet FTTH-GPON\"",
      "Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Customer already owns item in \"FN199: VDSL Super Vectoring\"",
      "Cart contains item in \"FN0302: Super WLAN Options\" AND !Customer already owns item in \"FN0300: Super WLAN ready\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" AND !Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\"",
      "!Customer already owns item in \"FN210: FIBRE\" AND Cart contains product \"FTTH-L2-BSA\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005677": {
    "ruleId": "CR005677",
    "ruleName": "unsub Hardware not allowed for compatible Rental Hardware",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Rental\" (FN108), \"Access Hardware\" (FN158), \"unsubsidized\" (FN201), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN108",
        "name": "Rental",
        "parentName": "Payment Mode"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN201",
        "name": "unsubsidized",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "cart.packageContainedInstalledBaseCategory(\"FN108: Rental\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005685": {
    "ruleId": "CR005685",
    "ruleName": "Rental Hardware not allowed for expired Sales Packages",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"24 Months Packages Expired\" (FN0521), \"Rental_AccessHW\" (FN178), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0521",
        "name": "24 Months Packages Expired",
        "parentName": "24 Months packages"
      },
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0521: 24 Months Packages Expired\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005687": {
    "ruleId": "CR005687",
    "ruleName": "sub hardware not allowed for compatible hardware (except techChange)",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Package sellable with Bandwidth 250000 DSL\" (FN183), \"VDSL Super Vectoring\" (FN199), \"VDSL Access Technology\" (FN223), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN223",
        "name": "VDSL Access Technology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN222",
        "name": "ADSL AccessTechnology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN220",
        "name": "Internet FTTH-GPON",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      },
      {
        "id": "FN0300",
        "name": "Super WLAN ready",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN200",
        "name": "subsidized",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains product 10007",
      "!Cart contains product 10009",
      "( Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\": Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN199: VDSL Super Vectoring\" ) OR ( Cart contains item in \"FN223: VDSL Access Technology\" AND !Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\": Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN137: VDSL\" ) OR ( Cart contains item in \"FN222: ADSL AccessTechnology\" AND Customer already owns item in \"FN138: ADSL\" ) OR ( Customer already owns item in \"FN210: FIBRE\": FIBRE\" AND Cart contains item in \"FN220: Internet FTTH-GPON\" ) OR ( Package includes item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) AND Customer already owns item in \"FN132: VDSL Vectoring\" ) OR ( Cart contains item in \"FN0302: Super WLAN Options\" AND Customer already owns item in \"FN0300: Super WLAN ready\" ) OR ( Cart contains product \"FTTH-L2-BSA-DTAG\" AND Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\" ) OR ( Customer already owns item in \"FN210: FIBRE\": FIBRE\" AND Cart contains product \"FTTH-L2-BSA\" )",
      "!( Package includes item in \"FN186: Fibre Package FIBRE\" AND cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005689": {
    "ruleId": "CR005689",
    "ruleName": "ADSL purchased Hardware allowed if  cart contains Internet ADSL",
    "businessDefinition": "ADSL Hardware allowed if cart contains Internet ADSL.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"ADSL AccessTechnology\" (FN222), \"ADSL\" (FN138), \"purchase OneTime_AccessHw\" (FN109), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN222",
        "name": "ADSL AccessTechnology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN109",
        "name": "purchase OneTime_AccessHw",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN222: ADSL AccessTechnology\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005695": {
    "ruleId": "CR005695",
    "ruleName": "VDSL purchased hardware allowed if  cart contains Internet VDSL",
    "businessDefinition": "VDSL hardware allowed if cart contains Internet VDSL.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"VDSL Access Technology\" (FN223), \"Package sellable with Bandwidth 250000 DSL\" (FN183), \"VDSL\" (FN137), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN223",
        "name": "VDSL Access Technology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN109",
        "name": "purchase OneTime_AccessHw",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN223: VDSL Access Technology\"",
      "!Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005701": {
    "ruleId": "CR005701",
    "ruleName": "VDSL-Vectoring purchased Hardware allowed if  cart contains Red I&P 250",
    "businessDefinition": "VDSL-Vectoring Hardware allowed if cart contains Red I&P 250.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Package sellable with Bandwidth 250000 DSL\" (FN183), \"VDSL Super Vectoring\" (FN199), \"purchase OneTime_AccessHw\" (FN109), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN109",
        "name": "purchase OneTime_AccessHw",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005707": {
    "ruleId": "CR005707",
    "ruleName": "purchased Fiber Hardware allowed for target Access Technology Fiber",
    "businessDefinition": "Fiber hardware allowed for Access Technology Fiber.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"FIBRE\" (FN210), \"purchase OneTime_AccessHw\" (FN109), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN109",
        "name": "purchase OneTime_AccessHw",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "!availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;GFNW)\") AND !availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;RWEFN)\")",
      "Cart contains product \"FTTH-GPON\" OR Cart contains product \"FTTH-L2-BSA\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005759": {
    "ruleId": "CR005759",
    "ruleName": "ILS: not allow TV Tariff-Options if no TV Tariff in cart",
    "businessDefinition": "ILS: not allow TV Tariff Options if no TV Tariff in cart.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"TV Tariff\" (FN157), \"TV Tariff Options\" (FN50), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN157",
        "name": "TV Tariff",
        "parentName": "TV"
      },
      {
        "id": "FN50",
        "name": "TV Tariff Options",
        "parentName": "TV"
      }
    ],
    "conditionsHumanReadable": [
      "!Package includes item in \"FN157: TV Tariff\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.207Z"
  },
  "CR005765": {
    "ruleId": "CR005765",
    "ruleName": "Basispreisanteil Not Allowed in DSL Portfolio 10/25 (ACQ & MIGCOC)",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Package sellable with Bandwidth 250000 DSL\" (FN183), \"Package sellable with Bandwidth 1000\" (FN36), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN143",
        "name": "Internet Bitstream",
        "parentName": "Internet Access Technology"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\" AND !Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Cart contains item in \"FN36: Package sellable with Bandwidth 1000\"",
      "Cart contains item in \"FN36: Package sellable with Bandwidth 1000\" AND !Cart contains item in \"FN143: Internet Bitstream\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005771": {
    "ruleId": "CR005771",
    "ruleName": "BB 50MBIT fibre defaulted-obligated with 50MBIT fibre tariff",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 Fibre\" (FN211), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN211",
        "name": "Package sellable with Bandwidth 50000 Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\"",
      "Cart contains item in \"FN211: Package sellable with Bandwidth 50000 Fibre\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005774": {
    "ruleId": "CR005774",
    "ruleName": "BB 100MBIT fibre defaulted-obligated with 100MBIT fibre tariff",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 100000 Fibre\" (FN212), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN212",
        "name": "Package sellable with Bandwidth 100000 Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\"",
      "Package includes item in \"FN212: Package sellable with Bandwidth 100000 Fibre\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005776": {
    "ruleId": "CR005776",
    "ruleName": "BB 250MBIT fibre defaulted-obligated with 250MBIT fibre tariff",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 250000 Fibre\" (FN213), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN213",
        "name": "Package sellable with Bandwidth 250000 Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\"",
      "Package includes item in \"FN213: Package sellable with Bandwidth 250000 Fibre\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005782": {
    "ruleId": "CR005782",
    "ruleName": "GigaKombi Household add GigaKombi-Marker VGK01TO",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product 10012"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005789": {
    "ruleId": "CR005789",
    "ruleName": "product cable availabilty defaulted-obligated in case of KAI available",
    "businessDefinition": "Enforces mandatory attachment policy for Cable Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Cable Broadband",
    "journeyContext": [
      "ACQ"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\"",
      "Line technology check: null, null, \"Kabel Internet & Phone\", \"GRUEN,GRUEN_GRAU,GELB\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005791": {
    "ruleId": "CR005791",
    "ruleName": "product fibre availabilty defaulted-obligated in case of fibre available",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"adslInternetConfiguration\" (FN218), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON,FTTH-L2-BSA-DTAG,FTTH-L2-BSA\", \"GRUEN,ORANGE,GELB_GRAU\"",
      "Cart contains item in \"FN218: adslInternetConfiguration\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005829": {
    "ruleId": "CR005829",
    "ruleName": "BB 50000 at all LTE50 packages obligated",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 LTE\" (FN145), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN145",
        "name": "Package sellable with Bandwidth 50000 LTE",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN145: Package sellable with Bandwidth 50000 LTE\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005854": {
    "ruleId": "CR005854",
    "ruleName": "WoWi Discount allowed for ILS in 10/16 portfolio",
    "businessDefinition": "WoWi Rabatt wird bei ILS innerhalb vom 10/16 Portfolio erlaubt.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"DSL_total\" (FN155), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN155",
        "name": "DSL_total",
        "parentName": "FN_Bundle Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ILSBLU\")",
      "Cart contains item in \"FN155: DSL_total\"",
      "installBase.containsProduct(\"GS_WoWi_5E[br]EOL\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005858": {
    "ruleId": "CR005858",
    "ruleName": "BB 100MBIT Telekom fibre defaulted-obligated with 100MBIT Telekom fibre tariff",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with BB 100MBIT Bitstream Fibre\" (FN0465), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0465",
        "name": "Package sellable with BB 100MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0465: Package sellable with BB 100MBIT Bitstream Fibre\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005860": {
    "ruleId": "CR005860",
    "ruleName": "BB 50MBIT Telekom fibre defaulted-obligated with 50MBIT Telekom fibre tariff",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with BB 50MBIT Bitstream Fibre\" (FN0461), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0461",
        "name": "Package sellable with BB 50MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0461: Package sellable with BB 50MBIT Bitstream Fibre\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005864": {
    "ruleId": "CR005864",
    "ruleName": "FTTH-L2-BSA-DTAG Obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-435).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Fibre Packages Wholebuy Bitstream\" (FN0463), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-435 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0463",
        "name": "Fibre Packages Wholebuy Bitstream",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\")",
      "Package includes item in \"FN0463: Fibre Packages Wholebuy Bitstream\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005898": {
    "ruleId": "CR005898",
    "ruleName": "BB 250MBIT Telekom fibre defaulted-obligated with 250MBIT Telekom fibre tariff",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with BB 250MBIT Bitstream Fibre\" (FN0467), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0467",
        "name": "Package sellable with BB 250MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\"",
      "Package includes item in \"FN0467: Package sellable with BB 250MBIT Bitstream Fibre\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005900": {
    "ruleId": "CR005900",
    "ruleName": "BB 500MBIT Telekom fibre defaulted-obligated with 250-MBIT Telekom fibre tariff",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with BB 500MBIT Bitstream Fibre\" (FN0469), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0469",
        "name": "Package sellable with BB 500MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\"",
      "Package includes item in \"FN0469: Package sellable with BB 500MBIT Bitstream Fibre\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005924": {
    "ruleId": "CR005924",
    "ruleName": "Telekom Glasfaser NK Hardware purchased allowed for target FTTH-L2-BSA-DTAG",
    "businessDefinition": "Telekom Glasfaser hardware allowed for target FTTH-L2-BSA-DTAG FB7530, FB7490 nicht mehr zugelassen für alle FTTH (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Telekom GF BK HW-Liste\" (FN0479), \"purchase OneTime_AccessHw\" (FN109), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN109",
        "name": "purchase OneTime_AccessHw",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005926": {
    "ruleId": "CR005926",
    "ruleName": "Glasfaser-Modem not Allowed in case of FritzBox 5590",
    "businessDefinition": "Enforces technical exclusivity: Prevents duplicate or unnecessary fiber modems (ONT) when an integrated fiber router (e.g. AVM FRITZ!Box 5590) is already selected in the configuration (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Telekom GF Router mit int-Modem\" (FN0485), \"FIBRE\" (FN210), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0485",
        "name": "Telekom GF Router mit int-Modem",
        "parentName": "Telekom GF BK HW-Liste"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains product \"FTTH-L2-BSA-DTAG\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" AND Cart contains item in \"FN0485: Telekom GF Router mit int-Modem\" AND !cart.packageContainsInstalledBaseProduct(\"20090213_sub\") AND !Cart contains item in \"FN210: FIBRE\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005941": {
    "ruleId": "CR005941",
    "ruleName": "GF Modem defaulted for DTAG if IAD not contains an int.Modem",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Telekom GF Router mit int-Modem\" (FN0485), \"FIBRE\" (FN210), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN0485",
        "name": "Telekom GF Router mit int-Modem",
        "parentName": "Telekom GF BK HW-Liste"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\"",
      "!Cart contains item in \"FN0485: Telekom GF Router mit int-Modem\"",
      "Cart contains item in \"FN210: FIBRE\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005943": {
    "ruleId": "CR005943",
    "ruleName": "GF Modem defaulted for DTAG if it is not in installedBase and no FritzBox5590 existing ",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"FIBRE\" (FN210), \"Fibre Packages sellable access supplier DTAG\" (FN0511), \"Telekom GF Router mit int-Modem\" (FN0485), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0511",
        "name": "Fibre Packages sellable access supplier DTAG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      },
      {
        "id": "FN0485",
        "name": "Telekom GF Router mit int-Modem",
        "parentName": "Telekom GF BK HW-Liste"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\"",
      "!cart.packageContainsInstalledBaseProduct(\"20090213_sub\")",
      "Package includes item in \"FN210: FIBRE\"",
      "!Customer already owns item in \"FN0511: Fibre Packages sellable access supplier DTAG\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005967": {
    "ruleId": "CR005967",
    "ruleName": "FTTH-L2-BSA  obligated",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Packages sellable access supplier DG\" (FN0503), \"Fibre Packages Wholebuy Bitstream\" (FN0463), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0503",
        "name": "Fibre Packages sellable access supplier DG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      },
      {
        "id": "FN0463",
        "name": "Fibre Packages Wholebuy Bitstream",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProduct(\"FTTH-L2-BSA\") AND Customer already owns item in \"FN0503: Fibre Packages sellable access supplier DG\"",
      "availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\") AND Package includes item in \"FN0463: Fibre Packages Wholebuy Bitstream\" AND ( !cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005969": {
    "ruleId": "CR005969",
    "ruleName": "BB100 MBITs obligated with Wholebuy (not DTAG)",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with BB 100MBIT Bitstream Fibre\" (FN0465), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0465",
        "name": "Package sellable with BB 100MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0465: Package sellable with BB 100MBIT Bitstream Fibre\"",
      "Cart contains product \"FTTH-L2-BSA\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005971": {
    "ruleId": "CR005971",
    "ruleName": "BB250 MBITs obligated with Wholebuy (not DTAG)",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with BB 250MBIT Bitstream Fibre\" (FN0467), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0467",
        "name": "Package sellable with BB 250MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0467: Package sellable with BB 250MBIT Bitstream Fibre\"",
      "Cart contains product \"FTTH-L2-BSA\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005973": {
    "ruleId": "CR005973",
    "ruleName": "BB500 MBITs obligated with Wholebuy (not DTAG)",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with BB 500MBIT Bitstream Fibre\" (FN0469), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0469",
        "name": "Package sellable with BB 500MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0469: Package sellable with BB 500MBIT Bitstream Fibre\"",
      "Cart contains product \"FTTH-L2-BSA\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR005975": {
    "ruleId": "CR005975",
    "ruleName": "BB1000 obligated for all Access Suppliers",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 1000 Mbit Fibre\" (FN208), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN208",
        "name": "Package sellable with Bandwidth 1000 Mbit Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN208: Package sellable with Bandwidth 1000 Mbit Fibre\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006017": {
    "ruleId": "CR006017",
    "ruleName": "downgrade from Fibre to DSL Packages not allowed",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts (Tracked under Jira OREF-476).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"fibreInternetConfiguration\" (FN219), \"Fibre Package FIBRE\" (FN186), \"DSL Package\" (FN76), THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Jira OREF-476 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON,FTTH-L2-BSA-DTAG,FTTH-L2-BSA\", \"GRUEN,ORANGE,GELB_GRAU\"",
      "cart.packageContainsInstalledBaseCategory(\"FN219: fibreInternetConfiguration\")",
      "cart.package.hasTariffWithVersion(\"equals\") OR Package includes item in \"FN186: Fibre Package FIBRE\" OR !Package includes item in \"FN76: DSL Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006027": {
    "ruleId": "CR006027",
    "ruleName": "ILS: HW not allowed for DSL Move Offnet",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration (Tracked under Jira OREF-381).",
    "plainLanguageIntent": "During [MIGCOC] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Hardware not allowed for MIGCOC\" (FN0509), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Jira OREF-381 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MIGCOC"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0509",
        "name": "Hardware not allowed for MIGCOC",
        "parentName": "Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ACQ\")",
      "cart.package.hasProcessContext(\"ILSBLU\")",
      "cart.package.hasProcessContext(\"MIGCOC\")",
      "cart.package.hasProcessContext(\"MOVBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006046": {
    "ruleId": "CR006046",
    "ruleName": "Min one IAD in one package ",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"Access Hardware\" (FN158), \"Bandwidth 50000\" (FN86), THEN the target item is marked as [MIN(1)].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "MIN(1)",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN86",
        "name": "Bandwidth 50000",
        "parentName": "Internet"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006048": {
    "ruleId": "CR006048",
    "ruleName": "ACQ: Add Versandkosten in case of new access-Hardware or accessory but not for Eigenhardware",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Accessory\" (FN169), \"Rental_AccessHW\" (FN178), \"purchase OneTime_AccessHw\" (FN109), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN169",
        "name": "Accessory",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      },
      {
        "id": "FN109",
        "name": "purchase OneTime_AccessHw",
        "parentName": "Payment Mode"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN169: Accessory\"",
      "Cart contains item in \"FN178: Rental_AccessHW\"",
      "Cart contains item in \"FN109: purchase OneTime_AccessHw\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006098": {
    "ruleId": "CR006098",
    "ruleName": "Basispreis removed bei 250 DSL(v2)",
    "businessDefinition": "Für die Tarife GigaZuhause 250 DSL und GigaZuhause Basic 250 DSL entfällt der Basispreisanteil von 5 Euro () (Tracked under Jira OREF-437).",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item is marked as [Not Allowed].",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Jira OREF-437 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"ILSBLU\")",
      "Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\": Package sellable with Bandwidth 250000 DSL\" OR Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\": Package sellable with Bandwidth 250000 DSL\" OR Cart contains product \"R708.2000000020-24\" OR Cart contains product \"R708.2000000010-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006101": {
    "ruleId": "CR006101",
    "ruleName": "Wechsel innerhalb DSL portfolio wird Preissenkung entfernt",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Fibre Package FIBRE\" (FN186), \"Promo2016_NotAllowed\" (FN176), THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN176",
        "name": "Promo2016_NotAllowed",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasTariffWithVersion(\">=\")",
      "Package includes item in \"FN76: DSL Package\" OR Package includes item in \"FN186: Fibre Package FIBRE\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006105": {
    "ruleId": "CR006105",
    "ruleName": "Sales Packages for FTTH-GPON allowed",
    "businessDefinition": "Allow all Sales Packages of FTTH GPON if availability of FTTH GPON 1000MBit has highest priority among all fibre products.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Package GPON\" (FN0507), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-GPON\", \"FIBRE\")",
      "!availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-GPON\", \"FIBRE\", \"(OWNER_APPROVAL;abgelehnt)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006117": {
    "ruleId": "CR006117",
    "ruleName": "Basispreisanteil Not Allowed in DSL 10/25 Portfolio (nur ILS)",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Package sellable with Bandwidth 250000 DSL\" (FN183), \"Package sellable with Bandwidth 1000\" (FN36), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN36",
        "name": "Package sellable with Bandwidth 1000",
        "parentName": "Sales Package"
      },
      {
        "id": "FN143",
        "name": "Internet Bitstream",
        "parentName": "Internet Access Technology"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\" AND cart.package.isTariffChanged() equals true AND !Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Cart contains item in \"FN36: Package sellable with Bandwidth 1000\"",
      "Package includes item in \"FN36: Package sellable with Bandwidth 1000\" AND cart.package.isTariffChanged() equals true AND !Cart contains item in \"FN143: Internet Bitstream\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006121": {
    "ruleId": "CR006121",
    "ruleName": "Sales Packages for FTTH-DTAG allowed",
    "businessDefinition": "Allow all Sales Packages of FTTH DTAG if DTAG hasHighest Prio on 1000MBit fibre.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Packages sellable access supplier DTAG\" (FN0511), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0511",
        "name": "Fibre Packages sellable access supplier DTAG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(ACCESS_SUPPLIER;DTAG)\") AND availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\") AND !availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(OWNER_APPROVAL;abgelehnt)\") AND ( cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.hasProcessContext(\"MOVBLU\") )",
      "availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(ACCESS_SUPPLIER;DTAG)\") AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU,GRUEN_GRAU\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\") AND !availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\", \"(OWNER_APPROVAL;abgelehnt)\") AND ( cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"ACQ\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006183": {
    "ruleId": "CR006183",
    "ruleName": "Sales Packages for FTTH-DGW allowed",
    "businessDefinition": "Allow all Fibre packages Deutsche Glasfaser if availability with 1000MBit has access supplier DG.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Packages sellable access supplier DG\" (FN0503), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0503",
        "name": "Fibre Packages sellable access supplier DG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;DGW)\") AND availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\")",
      "availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;DGW)\") AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\") AND ( cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"ACQ\") )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006193": {
    "ruleId": "CR006193",
    "ruleName": "Allow Winback promotions for existing customer_redesign",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-384).",
    "plainLanguageIntent": "During [ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Promo_winback_redesign\" (FN0560), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-384 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0560",
        "name": "Promo_winback_redesign",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0560: Promo_winback_redesign\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006195": {
    "ruleId": "CR006195",
    "ruleName": "allow installedBase Stay promotions for existing customer",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-384).",
    "plainLanguageIntent": "During [ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Promo_stay_redesign\" (FN0568), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-384 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0568",
        "name": "Promo_stay_redesign",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0568: Promo_stay_redesign\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006211": {
    "ruleId": "CR006211",
    "ruleName": "Tariff Change has to be done in case of corresponding NBA indicator",
    "businessDefinition": "TariffChange has to be done in case of corresponding NBA indicator.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL-Paketwechsel\" (FN0513), THEN the target item is marked as [MIN(1)].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "MIN(1)",
    "referencedCategories": [
      {
        "id": "FN0513",
        "name": "DSL-Paketwechsel",
        "parentName": "FN_Package Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false",
      "cart.containsNBAIndicator(\"DSL-TW\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.208Z"
  },
  "CR006213": {
    "ruleId": "CR006213",
    "ruleName": "Access HW not removable if HW in installedbase compatible",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (8 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), \"VDSL Vectoring\" (FN132), \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) AND Customer already owns item in \"FN132: VDSL Vectoring\"",
      "!Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN137: VDSL\" AND ( Cart contains product \"NGN-VDSL\" OR Cart contains product \"IP-Bitstream VDSL\" OR Cart contains product \"L2-BSA VDSL\" )",
      "cart.package.isTariffChanged() equals false AND !Cart contains product 10007 AND !Cart contains product 10009",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" AND Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\"",
      "Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN199: VDSL Super Vectoring\"",
      "Customer already owns item in \"FN210: FIBRE\" AND Cart contains product \"FTTH-L2-BSA\"",
      "Cart contains product \"FTTH-GPON\" AND Customer already owns item in \"FN210: FIBRE\"",
      "Customer already owns item in \"FN138: ADSL\" AND ( Cart contains product \"NGN-DSL\" OR Cart contains product \"IP-Bitstream\" OR Cart contains product \"IP-Bitstream ADSL\" OR Cart contains product \"NGN-ADSL\" )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006215": {
    "ruleId": "CR006215",
    "ruleName": "Access HW allowed if HW in installed base in status life compatible (v3)",
    "businessDefinition": "Access HW allowed if HW in installed base in status life compatible FTTH-L2-BSA-DTAG added, DG added (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (9 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), \"VDSL Vectoring\" (FN132), \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN31",
        "name": "Internet Access Technology",
        "parentName": "Technlogy Configuration"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false",
      "Cart contains item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND Customer already owns item in \"FN132: VDSL Vectoring\" AND ( availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) OR availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 2) )",
      "!Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN137: VDSL\" AND ( Cart contains product \"NGN-VDSL\" OR Cart contains product \"IP-Bitstream VDSL\" OR Cart contains product \"L2-BSA VDSL\" )",
      "cart.package.hasProcessContext(\"ILSBLU\") AND !Package includes item in \"FN31: Internet Access Technology\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" AND Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\"",
      "Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN199: VDSL Super Vectoring\"",
      "Cart contains product \"FTTH-GPON\" AND Customer already owns item in \"FN210: FIBRE\"",
      "Customer already owns item in \"FN210: FIBRE\" AND Cart contains product \"FTTH-L2-BSA\"",
      "Customer already owns item in \"FN138: ADSL\" AND ( Cart contains product \"NGN-DSL\" OR Cart contains product \"IP-Bitstream\" OR Cart contains product \"IP-Bitstream ADSL\" OR Cart contains product \"NGN-ADSL\" )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006219": {
    "ruleId": "CR006219",
    "ruleName": "Tariff restriction less than DSL 40 EURO",
    "businessDefinition": "Tariff restriction less than DSL40EUR.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"SalesPackages less than 39,99 Euro\" (FN0515), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0515",
        "name": "SalesPackages less than 39,99 Euro",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsNBAIndicator(\"DSL40EUR\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006239": {
    "ruleId": "CR006239",
    "ruleName": "Removes promotion if customer has DSL in IB and Fibre in the cart_redesign",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-531).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"fibreInternetConfiguration\" (FN219), \"Promo_winback_redesign\" (FN0560), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-531 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN0560",
        "name": "Promo_winback_redesign",
        "parentName": "Promotions"
      },
      {
        "id": "FN0568",
        "name": "Promo_stay_redesign",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "Customer already owns item in \"FN218: adslInternetConfiguration\"",
      "Package includes item in \"FN219: fibreInternetConfiguration\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006264": {
    "ruleId": "CR006264",
    "ruleName": "No shippingFee in case of a mandatory HW change",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (8 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), \"VDSL Vectoring\" (FN132), \"VDSL Access Technology\" (FN223), THEN the target item is marked as [Not Allowed].",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN223",
        "name": "VDSL Access Technology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN222",
        "name": "ADSL AccessTechnology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN220",
        "name": "Internet FTTH-GPON",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      },
      {
        "id": "FN0300",
        "name": "Super WLAN ready",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) AND !Customer already owns item in \"FN132: VDSL Vectoring\"",
      "Cart contains item in \"FN223: VDSL Access Technology\" AND !Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Customer already owns item in \"FN137: VDSL\"",
      "Cart contains item in \"FN222: ADSL AccessTechnology\" AND !Customer already owns item in \"FN138: ADSL\"",
      "!Customer already owns item in \"FN210: FIBRE\" AND Cart contains item in \"FN220: Internet FTTH-GPON\"",
      "Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Customer already owns item in \"FN199: VDSL Super Vectoring\"",
      "Cart contains item in \"FN0302: Super WLAN Options\" AND !Customer already owns item in \"FN0300: Super WLAN ready\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" AND !Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\"",
      "!Customer already owns item in \"FN210: FIBRE\" AND Cart contains product \"FTTH-L2-BSA\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006268": {
    "ruleId": "CR006268",
    "ruleName": "GPON or DG rental hardware allowed if cart contains Fibre",
    "businessDefinition": "FIbre rental hardware allowed if cart contains Fibre.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Rental_AccessHW\" (FN178), \"adslInternetConfiguration\" (FN218), \"FIBRE\" (FN210), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\" OR Cart contains product \"FTTH-L2-BSA\"",
      "cart.package.tariffInMinimumDuration() equals false OR !Customer already owns item in \"FN178: Rental_AccessHW\" OR cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\") OR !Customer already owns item in \"FN210: FIBRE\"",
      "!availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;GFNW)\") AND !availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;RWEFN)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006273": {
    "ruleId": "CR006273",
    "ruleName": "Add a shipping fee based on added HW based on category ID",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Accessory\" (FN169), \"Access Hardware\" (FN158), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN169",
        "name": "Accessory",
        "parentName": "Hardware Capability"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "New item added in \"FN169: Accessory\"",
      "New item added in \"FN158: Access Hardware\" AND !cart.packageContainsNewProduct(\"20099900_sub\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006281": {
    "ruleId": "CR006281",
    "ruleName": "Allow customer own hardware 20099900",
    "businessDefinition": "Commercial compatibility rule for DSL Broadband (Allow customer own hardware 20099900). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (9 conditions) are satisfied involving Category \"Rental_AccessHW\" (FN178), \"FIBRE\" (FN210), \"VDSL Access Technology\" (FN223), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN223",
        "name": "VDSL Access Technology",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals false",
      "!Customer already owns item in \"FN178: Rental_AccessHW\"",
      "cart.package.hasProcessContext(\"MIGCOC\")",
      "cart.package.hasProcessContext(\"ACQ\")",
      "!Customer already owns item in \"FN210: FIBRE\" AND ( Cart contains product \"FTTH-GPON\" OR Cart contains product \"FTTH-L2-BSA\" )",
      "Cart contains item in \"FN223: VDSL Access Technology\" AND !Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Customer already owns item in \"FN137: VDSL\"",
      "Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND !Customer already owns item in \"FN132: VDSL Vectoring\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" AND !Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\"",
      "Package includes item in \"FN186: Fibre Package FIBRE\" AND cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006284": {
    "ruleId": "CR006284",
    "ruleName": "Fibre DTAG rental hardware is allowed if cart contains FTTH DTAG",
    "businessDefinition": "FIbre DTAG rental hardware allowed if cart contains FTTH-DTAG.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Rental_AccessHW\" (FN178), \"adslInternetConfiguration\" (FN218), \"Telekom GF BK HW-Liste\" (FN0479), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN178",
        "name": "Rental_AccessHW",
        "parentName": "Rental"
      },
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN31",
        "name": "Internet Access Technology",
        "parentName": "Technlogy Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals false OR !Customer already owns item in \"FN178: Rental_AccessHW\" OR cart.packageContainedInstalledBaseCategory(\"FN218: adslInternetConfiguration\") OR !Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" OR ( !Cart contains item in \"FN31: Internet Access Technology\" AND Package includes item in \"FN0479: Telekom GF BK HW-Liste\" )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006306": {
    "ruleId": "CR006306",
    "ruleName": "Not_allow HW Retention goody if hardware is changed",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Promo_WinbackStay_Hardware\" (FN0347), THEN the target item is marked as [Not Allowed].",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0347",
        "name": "Promo_WinbackStay_Hardware",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "Customer already owns item in \"FN0347: Promo_WinbackStay_Hardware\"",
      "New item added in \"FN0347: Promo_WinbackStay_Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006324": {
    "ruleId": "CR006324",
    "ruleName": "Sales Packages for FTTH-OXG allowed",
    "businessDefinition": "Allow all Fibre packages OXG if availability with 1000MBit has access supplier OXG In case ACQ OXG can be booked if VFP raise GRUEN, ORANGE or GELB_GRAU In case ILS only VFP GRUEN is considered.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Packages sellable access supplier OXG\" (FN0523), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0523",
        "name": "Fibre Packages sellable access supplier OXG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;OXGG)\") AND availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\") AND !availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-L2-BSA\", \"FIBRE\", \"(OWNER_APPROVAL;abgelehnt)\") AND ( cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"ACQ\") )",
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;OXGG)\") AND availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\") AND !availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-L2-BSA\", \"FIBRE\", \"(OWNER_APPROVAL;abgelehnt)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006327": {
    "ruleId": "CR006327",
    "ruleName": "Manual Promo: DSL Young discount is allowed for GigaZuhause 50/100/ 250",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"R708.2000000017-24\" OR Cart contains product \"R708.2000000019-24\" OR Cart contains product \"R708.2000000020-24\"",
      "cart.package.hasProcessContext(\"ILSBLU\") AND cart.packageContainsInstalledBaseProduct(\"GS_YOUNG_24x5E[br]\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006334": {
    "ruleId": "CR006334",
    "ruleName": "Category Promo not allowed in Basic Packages",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Promo_NotAllowed_Basic_Packages\" (FN0531), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0531",
        "name": "Promo_NotAllowed_Basic_Packages",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.containsProductInProductFamily(\"FNFamily1\")",
      "cart.package.containsProductInProductFamily(\"FNFamily6\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006343": {
    "ruleId": "CR006343",
    "ruleName": "Promo-Code allowed for Young Promo Ausgleich (ILS)",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"R708.2000000017-24\" OR Cart contains product \"R708.2000000019-24\" OR Cart contains product \"R708.2000000020-24\"",
      "cart.package.hasProcessContext(\"ILSBLU\") AND cart.packageContainsInstalledBaseProduct(\"GS_YOUNG_24x5E[br]\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006355": {
    "ruleId": "CR006355",
    "ruleName": "Not Allow comfortPromo in case not both 90HW and comfortAccess are true",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Basic Access\" (FN78), \"Hardware for Komfort-Goody\" (FN0525), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN78",
        "name": "Basic Access",
        "parentName": "Voice Access"
      },
      {
        "id": "FN0525",
        "name": "Hardware for Komfort-Goody",
        "parentName": "Hardware Class"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN78: Basic Access\"",
      "!Package includes item in \"FN0525: Hardware for Komfort-Goody\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006363": {
    "ruleId": "CR006363",
    "ruleName": "Sales Packages FTTH-DGW for Default Package allowed",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Fibre Packages sellable access supplier DG\" (FN0503), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0503",
        "name": "Fibre Packages sellable access supplier DG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R70.1000000129-24\"",
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;DGW)\")",
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006365": {
    "ruleId": "CR006365",
    "ruleName": "Sales Packages FTTH-DTAG for Default Package allowed",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Packages sellable access supplier DTAG\" (FN0511), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0511",
        "name": "Fibre Packages sellable access supplier DTAG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R70.1000000129-24\"",
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006371": {
    "ruleId": "CR006371",
    "ruleName": "Sales Packages for FTTH-GPON for Default Package are allowed",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Package GPON\" (FN0507), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R70.1000000129-24\"",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB,GELB_GRAU,ORANGE\", \"FTTH-GPON\", \"FIBRE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006401": {
    "ruleId": "CR006401",
    "ruleName": "Not allow second DSL sales package except fibre preMarketing and homePassed",
    "businessDefinition": "Not allow second DSL sales package for ILS except fibre preMarketing and homePassed.",
    "plainLanguageIntent": "During [ACQ] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Sales Package\" (FN20), \"DSL Package\" (FN76), \"Fibre Package FIBRE\" (FN186), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Customer already owns item in \"FN20: Sales Package\"",
      "Package includes item in \"FN76: DSL Package\" OR ( Package includes item in \"FN186: Fibre Package FIBRE\" AND Line technology check: 1000000, null, \"FTTH-GPON,FTTH-L2-BSA-DTAG,FTTH-L2-BSA\", \"GRUEN,GELB\" )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006436": {
    "ruleId": "CR006436",
    "ruleName": "SecureNet only allowed if already installedBase",
    "businessDefinition": "SecureNet only allowed if already in installedBase.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "installBase.containsProduct(\"I1414ISN01\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006438": {
    "ruleId": "CR006438",
    "ruleName": "Safety Package not allowed during tariff change",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Security Package\" (FN45), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN45",
        "name": "Security Package",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006442": {
    "ruleId": "CR006442",
    "ruleName": "ILS: DSL Promo GS_DSL_12x30 Euro not allowed at a tariff change from DSL to Fiber",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Package FIBRE\" (FN186), \"DSL Package\" (FN76), \"Promo_NotAllowed_Fibre_Packages\" (FN0539), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0539",
        "name": "Promo_NotAllowed_Fibre_Packages",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN186: Fibre Package FIBRE\"",
      "Customer already owns item in \"FN76: DSL Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006444": {
    "ruleId": "CR006444",
    "ruleName": "Allow hardware Retention Promo if it is already in installedBase",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Promo_WinbackStay_Hardware\" (FN0347), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0347",
        "name": "Promo_WinbackStay_Hardware",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0347: Promo_WinbackStay_Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006459": {
    "ruleId": "CR006459",
    "ruleName": "Sales Packages FTTH-OXG for Default Package allowed",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Fibre Packages sellable access supplier OXG\" (FN0523), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0523",
        "name": "Fibre Packages sellable access supplier OXG",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R70.1000000129-24\"",
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;OXGG)\")",
      "availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006464": {
    "ruleId": "CR006464",
    "ruleName": "Wechselgarantie Service defaulted ",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Wechselgarantie 12 month packages DSL - used for old portfolio\" (FN0548), \"Wechselgarantie 12 month packages GPON\" (FN0550), \"Wechselgarantie 18 month packages Wholebuy\" (FN0544), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN0548",
        "name": "Wechselgarantie 12 month packages DSL - used for old portfolio",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0550",
        "name": "Wechselgarantie 12 month packages GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0544",
        "name": "Wechselgarantie 18 month packages Wholebuy",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN0548: Wechselgarantie 12 month packages DSL - used for old portfolio\"",
      "Cart contains item in \"FN0550: Wechselgarantie 12 month packages GPON\"",
      "Package includes item in \"FN0544: Wechselgarantie 18 month packages Wholebuy\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006466": {
    "ruleId": "CR006466",
    "ruleName": "18 month Wechselgarantie Packages allowed - Availability (Green) FIBRE",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Double Play Package\" (FN74), \"Wechselgarantie 18 month packages Wholebuy\" (FN0544), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN74",
        "name": "Double Play Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0544",
        "name": "Wechselgarantie 18 month packages Wholebuy",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "customer.tariffIsInDay() > 182",
      "Customer already owns item in \"FN74: Double Play Package\"",
      "installBase.containsProduct(\"FTTH-L2-BSA\") OR installBase.containsProduct(\"FTTH-L2-BSA-DTAG\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006468": {
    "ruleId": "CR006468",
    "ruleName": "ILS: Reduce offer of FRITZ!Box 7530 for free to Winback only",
    "businessDefinition": "Reduce offer of FRITZ!Box 7530 for free to winback only.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Winback and Prolongation\" (FN0319), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0319",
        "name": "Winback and Prolongation",
        "parentName": "FN_Package Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProduct(\"20090173_sub\")",
      "!Package includes item in \"FN0319: Winback and Prolongation\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006472": {
    "ruleId": "CR006472",
    "ruleName": "12 month Wechselgarantie Packages DSL allowed",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Double Play Package\" (FN74), \"Wechselgarantie 12 month packages DSL - used for old portfolio\" (FN0548), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN74",
        "name": "Double Play Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0548",
        "name": "Wechselgarantie 12 month packages DSL - used for old portfolio",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "Customer already owns item in \"FN218: adslInternetConfiguration\"",
      "customer.tariffIsInDay() > 365",
      "Customer already owns item in \"FN74: Double Play Package\"",
      "Package includes item in \"FN0548: Wechselgarantie 12 month packages DSL - used for old portfolio\" OR cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"<\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006474": {
    "ruleId": "CR006474",
    "ruleName": "12 month Wechselgarantie Packages GPON allowed",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Double Play Package\" (FN74), \"Wechselgarantie 12 month packages GPON\" (FN0550), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN74",
        "name": "Double Play Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0550",
        "name": "Wechselgarantie 12 month packages GPON",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "customer.tariffIsInDay() > 365",
      "Customer already owns item in \"FN74: Double Play Package\"",
      "installBase.containsProduct(\"FTTH-GPON\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006476": {
    "ruleId": "CR006476",
    "ruleName": "Wechselgarantie Packages generally not allowed new portfolio",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Wechselgarantie 12 month packages DSL - used for old portfolio\" (FN0548), \"Wechselgarantie 12 month packages GPON\" (FN0550), \"Wechselgarantie 18 month packages Wholebuy\" (FN0544), THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0548",
        "name": "Wechselgarantie 12 month packages DSL - used for old portfolio",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0550",
        "name": "Wechselgarantie 12 month packages GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0544",
        "name": "Wechselgarantie 18 month packages Wholebuy",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0639",
        "name": "Wechselgarantie 18 month packages DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"MIGCOC\")",
      "cart.package.hasProcessContext(\"ACQ\")",
      "!Cart contains item in \"FN0548: Wechselgarantie 12 month packages DSL - used for old portfolio\" AND !Cart contains item in \"FN0550: Wechselgarantie 12 month packages GPON\" AND !Cart contains item in \"FN0544: Wechselgarantie 18 month packages Wholebuy\" AND !Package includes item in \"FN0639: Wechselgarantie 18 month packages DSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006478": {
    "ruleId": "CR006478",
    "ruleName": "Product V0322OT defaulted in case of Wechselgarantie",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Wechselgarantie 12 month packages DSL - used for old portfolio\" (FN0548), \"Wechselgarantie 12 month packages GPON\" (FN0550), \"Wechselgarantie 18 month packages Wholebuy\" (FN0544), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN0548",
        "name": "Wechselgarantie 12 month packages DSL - used for old portfolio",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0550",
        "name": "Wechselgarantie 12 month packages GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0544",
        "name": "Wechselgarantie 18 month packages Wholebuy",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN0548: Wechselgarantie 12 month packages DSL - used for old portfolio\"",
      "Cart contains item in \"FN0550: Wechselgarantie 12 month packages GPON\"",
      "Package includes item in \"FN0544: Wechselgarantie 18 month packages Wholebuy\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006483": {
    "ruleId": "CR006483",
    "ruleName": "Allow Winback products in case of default package",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Winback and Prolongation\" (FN0319), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0319",
        "name": "Winback and Prolongation",
        "parentName": "FN_Package Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R70.1000000129-24\"",
      "cart.containsNBAIndicator(\"winback\") OR cart.containsNBAIndicator(\"stay\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006487": {
    "ruleId": "CR006487",
    "ruleName": "EasyBox 805(20090284_sub) defaulted with SuperWLAN",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Super WLAN Options\" (FN0302), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN0302: Super WLAN Options\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006492": {
    "ruleId": "CR006492",
    "ruleName": "Wechselgarantie for Unbekanntes Paket not allowed new Portfolio",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Wechselgarantie 18 month packages Wholebuy\" (FN0544), \"Wechselgarantie 12 month packages DSL - used for old portfolio\" (FN0548), \"Wechselgarantie 12 month packages GPON\" (FN0550), THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0544",
        "name": "Wechselgarantie 18 month packages Wholebuy",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0548",
        "name": "Wechselgarantie 12 month packages DSL - used for old portfolio",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0550",
        "name": "Wechselgarantie 12 month packages GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0639",
        "name": "Wechselgarantie 18 month packages DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R70.1000000129-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006494": {
    "ruleId": "CR006494",
    "ruleName": "Hardware Promo 1_99 requires Hardware 1_99 Box",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Hardware 1_99 Promo\" (FN0411), \"1_99 Box\" (FN0373), THEN the target item is marked as [Eql(1)].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN0411",
        "name": "Hardware 1_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0373",
        "name": "1_99 Box",
        "parentName": "Hardware Class"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0411: Hardware 1_99 Promo\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006496": {
    "ruleId": "CR006496",
    "ruleName": "do not allow only LTE hardware for DSL or Fibre",
    "businessDefinition": "do not allow only-LTE hardware for DSL or fibre.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Fibre Package GPON\" (FN0507), \"Fibre Packages Wholebuy Bitstream\" (FN0463), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0463",
        "name": "Fibre Packages Wholebuy Bitstream",
        "parentName": "Sales Package"
      },
      {
        "id": "FN24",
        "name": "Hardware",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN76: DSL Package\"",
      "Cart contains item in \"FN0507: Fibre Package GPON\"",
      "Package includes item in \"FN0463: Fibre Packages Wholebuy Bitstream\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006498": {
    "ruleId": "CR006498",
    "ruleName": "Hardware Promo 2_99 requires Hardware 2_99 Box",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Hardware 2_99 Promo\" (FN0413), \"2_99 Box\" (FN0375), THEN the target item is marked as [Eql(1)].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN0413",
        "name": "Hardware 2_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0375",
        "name": "2_99 Box",
        "parentName": "Hardware Class"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0413: Hardware 2_99 Promo\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006500": {
    "ruleId": "CR006500",
    "ruleName": "Hardware Promo 4_99 requires Hardware 4_99 Box",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Hardware 4_99 Promo\" (FN0415), \"4_99 Box\" (FN0377), THEN the target item is marked as [Eql(1)].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN0415",
        "name": "Hardware 4_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0377",
        "name": "4_99 Box",
        "parentName": "Hardware Class"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0415: Hardware 4_99 Promo\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006502": {
    "ruleId": "CR006502",
    "ruleName": "Hardware Promo 5_99 requires Hardware 5_99 Box",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Hardware 5_99 Promo\" (FN0417), \"5_99 Box\" (FN0379), THEN the target item is marked as [Eql(1)].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN0417",
        "name": "Hardware 5_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0379",
        "name": "5_99 Box",
        "parentName": "Hardware Class"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0417: Hardware 5_99 Promo\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006504": {
    "ruleId": "CR006504",
    "ruleName": "Hardware Promo 6_99 requires Hardware 6_99 Box",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Hardware 6_99 Promo\" (FN0423), \"6_99 Box\" (FN0425), THEN the target item is marked as [Eql(1)].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Eql(1)",
    "referencedCategories": [
      {
        "id": "FN0423",
        "name": "Hardware 6_99 Promo",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0425",
        "name": "6_99 Box",
        "parentName": "Hardware Class"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0423: Hardware 6_99 Promo\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006507": {
    "ruleId": "CR006507",
    "ruleName": "Allow old GigaKombi Marke to make it available for SR369011",
    "businessDefinition": "ILS, in case Inventory conains old GigaKombi Marke V0987, allow this to identifier GigaKombi Flat later..",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Bundle Tariff Options\" (FN51), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN51",
        "name": "Bundle Tariff Options",
        "parentName": "Bundle Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ILSBLU\")",
      "cart.packageContainsInstalledBaseProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.209Z"
  },
  "CR006510": {
    "ruleId": "CR006510",
    "ruleName": "EasyBox 805 (20090284_sub) defaulted at DSL package",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Super WLAN ready\" (FN0300), \"Super WLAN Options\" (FN0302), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0300",
        "name": "Super WLAN ready",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "( !Cart contains product \"R708.2000000009-24\" AND !Cart contains product \"R708.2000000010-24\" AND ( cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") ) ) OR ( !Cart contains item in \"FN0300: Super WLAN ready\" AND Cart contains item in \"FN0302: Super WLAN Options\" ) OR ( cart.package.hasProcessContext(\"MOVBLU\") OR cart.package.hasProcessContext(\"MOV121\") OR ( ( Package includes item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) AND !cart.packageContainsInstalledBaseCategory(\"FN132: VDSL Vectoring\") ) OR ( !cart.packageContainsInstalledBaseCategory(\"FN137: VDSL\") AND ( Cart contains product \"NGN-VDSL\" OR Cart contains product \"IP-Bitstream VDSL\" OR Cart contains product \"L2-BSA VDSL\" ) ) OR ( !cart.packageContainsInstalledBaseCategory(\"FN138: ADSL\") AND ( Cart contains product \"NGN-DSL\" OR Cart contains product \"IP-Bitstream\" ) ) ) )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006514": {
    "ruleId": "CR006514",
    "ruleName": "ILS: Product 20090236 not allowed if InstalledBase contains either 20090219 or 20090202",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.packageContainsInstalledBaseProduct(\"20090219_sub\")",
      "cart.packageContainsInstalledBaseProduct(\"20090202_sub\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006527": {
    "ruleId": "CR006527",
    "ruleName": "ILS: New GigaKombi-Marker is booked for a tariff change done on an old GigKombi Offer",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"DSL_total\" (FN155), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN155",
        "name": "DSL_total",
        "parentName": "FN_Bundle Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN155: DSL_total\"",
      "cart.package.isTariffChanged() equals true",
      "installBase.containsProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006532": {
    "ruleId": "CR006532",
    "ruleName": "ILS: GS_GKL_VoiceOption_9.99 bookable in Winback or Retention scenario",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"combined Flat Options\" (FN128), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN128",
        "name": "combined Flat Options",
        "parentName": "Voice Flat Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseProduct(\"V0987TO\")",
      "Cart contains product \"VGK01TO\"",
      "cart.containsNBAIndicator(\"winback\") OR cart.containsNBAIndicator(\"stay\") OR Cart contains product 10016 OR cart.packageContainsInstalledBaseProduct(\"GS_GKL_VoiceOption_9_99[br]EOL\")",
      "Package includes item in \"FN128: combined Flat Options\" OR ( Cart contains product \"V1204TO\" AND Cart contains product \"V1210TO\" )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006534": {
    "ruleId": "CR006534",
    "ruleName": "EasyBox 805 (20090284_sub) defaulted with SuperWLAN Option",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Super WLAN ready\" (FN0300), \"Super WLAN Options\" (FN0302), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN0300",
        "name": "Super WLAN ready",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains item in \"FN0300: Super WLAN ready\"",
      "Cart contains item in \"FN0302: Super WLAN Options\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006536": {
    "ruleId": "CR006536",
    "ruleName": "ILS: Remove existing HW promo in case HW-Retention is booked",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Promo_WinbackStay_Hardware\" (FN0347), \"Promo_HW_Miete\" (FN0558), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0347",
        "name": "Promo_WinbackStay_Hardware",
        "parentName": "Promotions"
      },
      {
        "id": "FN0558",
        "name": "Promo_HW_Miete",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "New item added in \"FN0347: Promo_WinbackStay_Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006555": {
    "ruleId": "CR006555",
    "ruleName": "Reduction of Winback or Stay Discount for 16 Mbit/s DSL Tariff to less than 10 Euros",
    "businessDefinition": "Reduction of Winback/Stay Discount for 16 Mbit/s DSL Tariff to less than 10 Euros due to negative margin.",
    "plainLanguageIntent": "During [ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Promo_10\" (FN0572), \"Promo_10\" (FN0564), \"Promo more than 10\" (FN0566), THEN the target item is marked as [Not Allowed].",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0572",
        "name": "Promo_10",
        "parentName": "Promo_stay_redesign"
      },
      {
        "id": "FN0564",
        "name": "Promo_10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0566",
        "name": "Promo more than 10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0582",
        "name": "Promo_7_50",
        "parentName": "Promo_stay_redesign"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R025.5000000073-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006557": {
    "ruleId": "CR006557",
    "ruleName": "allow GigaKombi Marker VGK01 for compatible tariff",
    "businessDefinition": "allow GigaKombi Marker VGK01 for compatible tariffs.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL_total\" (FN155), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN155",
        "name": "DSL_total",
        "parentName": "FN_Bundle Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN155: DSL_total\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006559": {
    "ruleId": "CR006559",
    "ruleName": "Add newHardwareIndicator in case of newly added hardware",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Access Hardware\" (FN158), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "New item added in \"FN158: Access Hardware\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006567": {
    "ruleId": "CR006567",
    "ruleName": "Add HardwareChangeIndicator in case of required hardware change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"Super WLAN Options\" (FN0302), \"Package sellable with Bandwidth 50000 DSL\" (FN41), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      },
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "!Package includes item in \"FN0302: Super WLAN Options\"",
      "( !Cart contains product \"R708.2000000009-24\" AND !Cart contains product \"R708.2000000010-24\" AND !cart.package.hasProcessContext(\"ILSBLU\") ) OR ( cart.package.hasProcessContext(\"ILSBLU\") AND ( ( Cart contains item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) AND !cart.packageContainsInstalledBaseCategory(\"FN132: VDSL Vectoring\") ) OR ( !Customer already owns item in \"FN137: VDSL\" AND ( Cart contains product \"NGN-VDSL\" OR Cart contains product \"IP-Bitstream VDSL\" OR Cart contains product \"L2-BSA VDSL\" ) ) OR ( !cart.packageContainsInstalledBaseCategory(\"FN138: ADSL\") AND ( Cart contains product \"NGN-DSL\" OR Cart contains product \"IP-Bitstream\" ) ) ) )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006569": {
    "ruleId": "CR006569",
    "ruleName": "old GigaKombi: Removal of Combined Flat options not allowed",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"combined Flat Options\" (FN128), THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [
      {
        "id": "FN128",
        "name": "combined Flat Options",
        "parentName": "Voice Flat Options"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN128: combined Flat Options\"",
      "cart.packageContainsInstalledBaseProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006597": {
    "ruleId": "CR006597",
    "ruleName": "Fibre - Default V1204 if V1205 in InstalledBase and on a tariff change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Fibre Package FIBRE\" (FN186), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "Package includes item in \"FN186: Fibre Package FIBRE\"",
      "cart.packageContainedInstalledBaseProduct(\"V1205TO\")",
      "!installBase.containsProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006599": {
    "ruleId": "CR006599",
    "ruleName": "Fibre - Default V1208 if V1206 in InstalledBase and on a tariff change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Fibre Package FIBRE\" (FN186), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "Package includes item in \"FN186: Fibre Package FIBRE\"",
      "cart.packageContainedInstalledBaseProduct(\"V1206TO\")",
      "!installBase.containsProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006601": {
    "ruleId": "CR006601",
    "ruleName": "Fibre - Default V1209 if V1207 in InstalledBase and on a tariff change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Fibre Package FIBRE\" (FN186), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "Package includes item in \"FN186: Fibre Package FIBRE\"",
      "cart.packageContainedInstalledBaseProduct(\"V1207TO\")",
      "!installBase.containsProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006603": {
    "ruleId": "CR006603",
    "ruleName": "DSL - Default V1204 if V1205 in InstalledBase and on a tariff change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "cart.package.isTariffChanged() equals true",
      "cart.packageContainedInstalledBaseProduct(\"V1205TO\")",
      "!installBase.containsProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006605": {
    "ruleId": "CR006605",
    "ruleName": "DSL - Default V1208 if V1206 in InstalledBase and on a tariff change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "cart.package.isTariffChanged() equals true",
      "cart.packageContainedInstalledBaseProduct(\"V1206TO\")",
      "!installBase.containsProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006607": {
    "ruleId": "CR006607",
    "ruleName": "DSL - Default V1209 if V1207 in InstalledBase and on a tariff change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "cart.package.isTariffChanged() equals true",
      "cart.packageContainedInstalledBaseProduct(\"V1207TO\")",
      "!installBase.containsProduct(\"V0987TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006610": {
    "ruleId": "CR006610",
    "ruleName": "DSL - Default V1210 if V1205, V1206, V1207 in InstalledBase and on a tariff change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "cart.package.isTariffChanged() equals true",
      "!installBase.containsProduct(\"V0987TO\")",
      "cart.packageContainedInstalledBaseProduct(\"V1205TO\") OR cart.packageContainedInstalledBaseProduct(\"V1206TO\") OR cart.packageContainedInstalledBaseProduct(\"V1207TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006614": {
    "ruleId": "CR006614",
    "ruleName": "V1210 Mobile-Flat Option not allowed",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "!Package includes item in \"FN76: DSL Package\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006635": {
    "ruleId": "CR006635",
    "ruleName": "Fibre 10/25 Portfolio  - BB150  Obligated ",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 150000 Fibre\" (FN0594), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0594",
        "name": "Package sellable with Bandwidth 150000 Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0594: Package sellable with Bandwidth 150000 Fibre\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006637": {
    "ruleId": "CR006637",
    "ruleName": "Fibre 10/25 Portfolio  - BB300 Obligated ",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 300000 Fibre\" (FN0590), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0590",
        "name": "Package sellable with Bandwidth 300000 Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0590: Package sellable with Bandwidth 300000 Fibre\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006639": {
    "ruleId": "CR006639",
    "ruleName": "Fibre 10/25 Portfolio  - BB600 Obligated ",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 600000 Fibre\" (FN0592), THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [
      {
        "id": "FN0592",
        "name": "Package sellable with Bandwidth 600000 Fibre",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0592: Package sellable with Bandwidth 600000 Fibre\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.isTariffChanged() equals true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006651": {
    "ruleId": "CR006651",
    "ruleName": "18 month Wechselgarantie Packages DSL allowed",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (6 conditions) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Double Play Package\" (FN74), \"Wechselgarantie 18 month packages DSL\" (FN0639), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN74",
        "name": "Double Play Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0639",
        "name": "Wechselgarantie 18 month packages DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "Customer already owns item in \"FN218: adslInternetConfiguration\"",
      "customer.tariffIsInDay() > 182",
      "Customer already owns item in \"FN74: Double Play Package\"",
      "cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"equals\")",
      "cart.package.isTariffChanged() equals false OR cart.package.hasTariffWithVersion(\"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006657": {
    "ruleId": "CR006657",
    "ruleName": "Voice Tariff-Options - Live allowed",
    "businessDefinition": "Voice Tariff Options - Live allowed.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Voice Tariff Options\" (FN48), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN48",
        "name": "Voice Tariff Options",
        "parentName": "Voice"
      }
    ],
    "conditionsHumanReadable": [
      "!cart.package.hasProcessContext(\"ILSBLU\")",
      "cart.package.isTariffChanged() equals true",
      "cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006659": {
    "ruleId": "CR006659",
    "ruleName": "Do not allow Winback promos more than 10 euro for DSL 25 and 50",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Promo more than 10\" (FN0566), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0566",
        "name": "Promo more than 10",
        "parentName": "Promo_winback_redesign"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"V018G\"",
      "Cart contains product \"V018H\"",
      "Cart contains product \"V018N\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006662": {
    "ruleId": "CR006662",
    "ruleName": "Do not allow 24 months downgrade tariffs during Minimum duration",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"24 Months packages\" (FN0355), THEN the target item is marked as [Not Allowed].",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0355",
        "name": "24 Months packages",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "!Cart contains product 10007",
      "!Cart contains product 10009"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006665": {
    "ruleId": "CR006665",
    "ruleName": "Default GS_Komf_3.99 if installedBase contains GS_Komf_4",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Hardware for Komfort-Goody\" (FN0525), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN0525",
        "name": "Hardware for Komfort-Goody",
        "parentName": "Hardware Class"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"C_comfort\"",
      "Package includes item in \"FN0525: Hardware for Komfort-Goody\"",
      "installBase.containsProduct(\"GS_DSL_KomfA_4E[br]EOL\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006667": {
    "ruleId": "CR006667",
    "ruleName": "Do not allow tariffs not allowed for Retail",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"SalesPackages not allowed for Retail\" (FN0641), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0641",
        "name": "SalesPackages not allowed for Retail",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "!Package includes item in \"FN0641: SalesPackages not allowed for Retail\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006669": {
    "ruleId": "CR006669",
    "ruleName": "12 x 5 Euro GPON Glasfaser Portfolio-Wechsel-Promo (PWP)",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"24 Months packages\" (FN0355), \"DSL Package\" (FN76), \"FN0653\" (FN0653), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN0355",
        "name": "24 Months packages",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0653",
        "name": "FN0653",
        "parentName": null
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Package includes item in \"FN0355: 24 Months packages\" AND Cart contains product \"R025.5000000532-24\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR Customer already owns item in \"FN76: DSL Package\" OR Customer already owns item in \"FN0653: FN0653\"",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_1_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_2_2021_01)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_3_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_6_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_7_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;VECHTA_2019_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;VECHTA_2020_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_VECHTA_2020_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;MAIN_KINZIG_KREIS_2_2022_06)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;MAIN_KINZIG_KREIS_3_2022_06)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;GRIMMA_2020_11)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;POCKAU_2022_07)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SCHWARZENBERG_2019_05)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006671": {
    "ruleId": "CR006671",
    "ruleName": "5 Euro GPON Glasfaser Portfolio-Wechsel-Promo (PWP)",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"Package sellable with Bandwidth 150000 Fibre\" (FN0594), \"Package sellable with Bandwidth 300000 Fibre\" (FN0590), \"Package sellable with Bandwidth 600000 Fibre\" (FN0592), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN0594",
        "name": "Package sellable with Bandwidth 150000 Fibre",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0590",
        "name": "Package sellable with Bandwidth 300000 Fibre",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0592",
        "name": "Package sellable with Bandwidth 600000 Fibre",
        "parentName": "Sales Package"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0653",
        "name": "FN0653",
        "parentName": null
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Package includes item in \"FN0594: Package sellable with Bandwidth 150000 Fibre\" OR Package includes item in \"FN0590: Package sellable with Bandwidth 300000 Fibre\" OR Package includes item in \"FN0592: Package sellable with Bandwidth 600000 Fibre\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR Customer already owns item in \"FN76: DSL Package\" OR Customer already owns item in \"FN0653: FN0653\"",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_1_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_2_2021_01)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_3_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_6_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_7_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;VECHTA_2019_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;VECHTA_2020_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_VECHTA_2020_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;MAIN_KINZIG_KREIS_2_2022_06)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;MAIN_KINZIG_KREIS_3_2022_06)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;GRIMMA_2020_11)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;POCKAU_2022_07)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SCHWARZENBERG_2019_05)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006677": {
    "ruleId": "CR006677",
    "ruleName": "do not allow Stay Promo for COPS",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Promo_stay_redesign\" (FN0568), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0568",
        "name": "Promo_stay_redesign",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "agent.hasOseChannel(\"COPS\")",
      "agent.hasCombinationOfChannelAndSubchannel(\"CA;IN,CA;IY,CA;NB,CA;NF,GP;IN,GP;IY,GP;NB,GP;NF,GT;IN,GT;IY,GT;NB,GT;NF,HG;IN,HG;IY,HG;NB,HG;NF,PX;IN,PX;IY,PX;NB,PX;NF,JE;IN,JE;IY,JE;NB,JE;NF,IQ;IN,IQ;IY,IQ;NB,IQ;NF,JT;IN,JT;IY,JT;NB,JT;NF\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006680": {
    "ruleId": "CR006680",
    "ruleName": "Do not allow Stay promo and Winback promo more than 5 Euro for Fibre",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"fibreInternetConfiguration\" (FN219), \"Promo_stay_redesign\" (FN0568), \"Promo_10\" (FN0564), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN0568",
        "name": "Promo_stay_redesign",
        "parentName": "Promotions"
      },
      {
        "id": "FN0564",
        "name": "Promo_10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0566",
        "name": "Promo more than 10",
        "parentName": "Promo_winback_redesign"
      },
      {
        "id": "FN0580",
        "name": "Promo_7_50",
        "parentName": "Promo_winback_redesign"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN219: fibreInternetConfiguration\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006682": {
    "ruleId": "CR006682",
    "ruleName": "Winback promos not allowed for Glasfaser 1000 package",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Package sellable with BB 1000MBIT Bitstream Fibre\" (FN0471), \"24 Months - Hardware\" (FN0351), \"12 Months - Hardware\" (FN0349), THEN the target item is marked as [Not Allowed].",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0471",
        "name": "Package sellable with BB 1000MBIT Bitstream Fibre",
        "parentName": "Fibre Packages Wholebuy Bitstream"
      },
      {
        "id": "FN0351",
        "name": "24 Months - Hardware",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0349",
        "name": "12 Months - Hardware",
        "parentName": "Promo_WinbackStay_Hardware"
      },
      {
        "id": "FN0578",
        "name": "24 months",
        "parentName": "Promo_stay_winback_duration"
      },
      {
        "id": "FN0576",
        "name": "12 months",
        "parentName": "Promo_stay_winback_duration"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN0471: Package sellable with BB 1000MBIT Bitstream Fibre\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006684": {
    "ruleId": "CR006684",
    "ruleName": "ILS: GS_GKL_VoiceOption_4.99 bookable in Winback or Retention scenario",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"combined Flat Options\" (FN128), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN128",
        "name": "combined Flat Options",
        "parentName": "Voice Flat Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseProduct(\"V0987TO\")",
      "Cart contains product \"VGK01TO\"",
      "!Package includes item in \"FN128: combined Flat Options\"",
      "( Cart contains product \"V1204TO\" AND !Cart contains product \"V1210TO\" ) OR ( !Cart contains product \"V1204TO\" AND Cart contains product \"V1210TO\" )",
      "cart.containsNBAIndicator(\"winback\") OR cart.containsNBAIndicator(\"stay\") OR Cart contains product 10016"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006690": {
    "ruleId": "CR006690",
    "ruleName": "Not allow the change from c_Basis to c_Comfort in old portfolio",
    "businessDefinition": "Not allow the change from c_basis to c_comfort in old portfolio.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"<\")",
      "installBase.containsProduct(\"C_basic\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006692": {
    "ruleId": "CR006692",
    "ruleName": "Not allow the change from c_Comfort  to c_Basis in old portfolio",
    "businessDefinition": "Not allow the change from c_comfort to c_basis in old portfolio.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"<\")",
      "!installBase.containsProduct(\"C_basic\")",
      "!Cart contains product 10018"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006697": {
    "ruleId": "CR006697",
    "ruleName": "Set new hardwareIndicator in case of SuperWLAN hardware change",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"VDSL Super Vectoring\" (FN199), \"Package sellable with Bandwidth 175000 DSL\" (FN185), \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN185",
        "name": "Package sellable with Bandwidth 175000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"ACQ\") OR cart.package.hasProcessContext(\"MIGCOC\") OR ( cart.package.hasProcessContext(\"ILSBLU\") AND !cart.packageContainsInstalledBaseCategory(\"FN199: VDSL Super Vectoring\") )",
      "Package includes item in \"FN185: Package sellable with Bandwidth 175000 DSL\" OR Package includes item in \"FN183: Package sellable with Bandwidth 250000 DSL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.210Z"
  },
  "CR006699": {
    "ruleId": "CR006699",
    "ruleName": "Set newHardwareIndicator in case of Fibre hardwareChange",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"FIBRE\" (FN210), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "!availability.hasHighestPriority(1000000, \"GRUEN,ORANGE,GELB_GRAU\", \"FTTH-L2-BSA\", \"FIBRE\", \"(ACCESS_SUPPLIER;GFNW)\")",
      "Cart contains product \"FTTH-GPON\" OR Cart contains product \"FTTH-L2-BSA\"",
      "cart.package.hasProcessContext(\"MIGCOC\") OR cart.package.hasProcessContext(\"ACQ\") OR ( cart.package.isTariffChanged() equals true AND !cart.packageContainsInstalledBaseCategory(\"FN210: FIBRE\") AND ( cart.package.hasProcessContext(\"ILSBLU\") OR cart.package.hasProcessContext(\"MOVBLU\") ) )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006705": {
    "ruleId": "CR006705",
    "ruleName": "Allow 12x5 and 12 x2,50 Stay promos on COPS channel",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Promo_stay_COPS\" (FN0647), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0647",
        "name": "Promo_stay_COPS",
        "parentName": "Promotions"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasTariffWithVersion(\">=\")",
      "cart.containsNBAIndicator(\"stay\")",
      "agent.hasCombinationOfChannelAndSubchannel(\"CA;IN,CA;IY,CA;NB,CA;NF,GP;IN,GP;IY,GP;NB,GP;NF,GT;IN,GT;IY,GT;NB,GT;NF,HG;IN,HG;IY,HG;NB,HG;NF,PX;IN,PX;IY,PX;NB,PX;NF,JE;IN,JE;IY,JE;NB,JE;NF,IQ;IN,IQ;IY,IQ;NB,IQ;NF,JT;IN,JT;IY,JT;NB,JT;NF\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006716": {
    "ruleId": "CR006716",
    "ruleName": "Remove all tariffs if agent creates an ACQ order while an open LineCreation exists",
    "businessDefinition": "Remove all tariffs if agent creates an ACQ order while an open LineCreation exists.",
    "plainLanguageIntent": "During [ACQ] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains item in \"FN20: Sales Package\"",
      "customer.hasPendingOrderOfType(\"DSL\", \"LineCreation\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006718": {
    "ruleId": "CR006718",
    "ruleName": "Add backoffice-marker for backoffice agents",
    "businessDefinition": "Add backoffice marker for backoffice agents.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "agent.hasPermission(\"BACKOFFICE_ORDER_CAPTURE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006736": {
    "ruleId": "CR006736",
    "ruleName": "Allow old GPON for backoffice booking",
    "businessDefinition": "allow old GPON for backoffice booking.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Fibre Package GPON\" (FN0507), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0507",
        "name": "Fibre Package GPON",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006742": {
    "ruleId": "CR006742",
    "ruleName": "Not allow the backoffice marker if there is a Mobile or Cable package in the cart ",
    "businessDefinition": "Not allow the backoffice marker if there is a mobile or cable package in the cart.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Cable Broadband",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryName(\"Mobile->ALLTO\")",
      "cart.containsProductInCategoryName(\"CABLE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006754": {
    "ruleId": "CR006754",
    "ruleName": "Not allow winback if there is no open termination",
    "businessDefinition": "Not allow Winback if there is no open termination.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product 10007",
      "!customer.hasPendingOrderOfType(\"DSL\", \"Termination\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006763": {
    "ruleId": "CR006763",
    "ruleName": "V0336 Defaulted for Move121",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [MOV121] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOV121"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"MOV121\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006765": {
    "ruleId": "CR006765",
    "ruleName": "Defaulted Obligated V0336 for Move121",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [MOV121] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOV121"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!agent.hasPermission(\"WAIVE_OVERRIDE_FEES\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006834": {
    "ruleId": "CR006834",
    "ruleName": "24 x 15 Euro GigaGemeinde Glasfaser Sonderpromo",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (5 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018",
      "Cart contains product \"R025.5000000527-24\"",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;VECHTA_2019_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;VECHTA_2020_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_VECHTA_2020_10)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006838": {
    "ruleId": "CR006838",
    "ruleName": "24 x 10 Euro GigaGemeinde Glasfaser Sonderpromo",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (5 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018",
      "Cart contains product \"R025.5000000527-24\"",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_1_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_2_2021_01)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_3_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_6_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_7_2022_03)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006840": {
    "ruleId": "CR006840",
    "ruleName": "24 x 20 Euro GigaGemeinde Glasfaser Sonderpromo",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (5 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018",
      "Cart contains product \"R025.5000000527-24\"",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;AURICH_2_2021_02)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;AURICH_2019_09)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006842": {
    "ruleId": "CR006842",
    "ruleName": "5 Euro Glasfaser PWP Promo offered for GPON in case of backoffice booking - 1",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (5 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "Cart contains product \"R025.5000000530-24\" OR Cart contains product \"R025.5000000529-24\" OR Cart contains product \"R025.5000000531-24\"",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_4_2021_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;ESSEN_1_2023_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;ESSEN_3_2024_05)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;GRONAU_1_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;GRONAU_2_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;HAINICHEN_2019_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;HAINICHEN_2_2021_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;HELMSTEDT_2_2022_11)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;KLIPPHAUSEN_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;RUEGEN_2021_12)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_BRANDENBURG_2022_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_MAIN_KINZIG_KREIS_4_2022_08)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_NOSSEN_3_2024_05)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_PIRNA_2_2023_02)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_PIRNA_3_2023_02)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_VELPKE_2022_07)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_LEIPZIG_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WILü_SB_NOSSEN_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_DRESDEN_2020_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_LEIPZIG_2021_04)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006844": {
    "ruleId": "CR006844",
    "ruleName": "5 Euro Glasfaser PWP Promo offered for GPON in case of backoffice booking - 2",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (5 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "Cart contains product \"R025.5000000530-24\" OR Cart contains product \"R025.5000000529-24\" OR Cart contains product \"R025.5000000531-24\"",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_NOSSEN_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_PIRNA_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_DRESDEN_2020_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_STENDAL_2020_02)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_WEDEL_2022_05)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SOEMMERDA_2021_12)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SOEST_2020_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_STENDAL_2020_02)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006846": {
    "ruleId": "CR006846",
    "ruleName": "12X5 Euro Glasfaser PWP Promo offered for GPON in case of backoffice booking - 1",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (5 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018",
      "Cart contains product \"R025.5000000532-24\"",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_4_2021_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;ESSEN_1_2023_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;ESSEN_3_2024_05)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;GRONAU_1_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;GRONAU_2_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;HAINICHEN_2019_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;HAINICHEN_2_2021_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;HELMSTEDT_2_2022_11)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;KLIPPHAUSEN_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;RUEGEN_2021_12)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_BRANDENBURG_2022_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_MAIN_KINZIG_KREIS_4_2022_08)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_NOSSEN_3_2024_05)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_PIRNA_2_2023_02)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_PIRNA_3_2023_02)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;SB_VELPKE_2022_07)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_LEIPZIG_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WILü_SB_NOSSEN_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_DRESDEN_2020_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_LEIPZIG_2021_04)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR006848": {
    "ruleId": "CR006848",
    "ruleName": "12X5 Euro Glasfaser PWP Promo offered for GPON in case of backoffice booking - 2",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC] on [DSL]: IF evaluation criteria (5 conditions) are satisfied, THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product 10018",
      "Cart contains product \"R025.5000000532-24\"",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_NOSSEN_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_PIRNA_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_DRESDEN_2020_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_STENDAL_2020_02)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SB_WEDEL_2022_05)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SOEMMERDA_2021_12)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_SOEST_2020_10)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;WiLü_STENDAL_2020_02)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007032": {
    "ruleId": "CR007032",
    "ruleName": "Add contract prolongation in case of MOVBLU without tariff change",
    "businessDefinition": "Enforces mandatory attachment policy for Fiber / GPON: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item automatically ATTACHES as MANDATORY (cannot be deselected).",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Defaulted-Obligated",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007041": {
    "ruleId": "CR007041",
    "ruleName": "ILS: Allow SuperWLAN First Extender",
    "businessDefinition": "ILS: Allow SWLAN Extender 1.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Super WLAN Extender I\" (FN0310), \"First Extender\" (FN0306), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0310",
        "name": "Super WLAN Extender I",
        "parentName": "Super WLAN Extender"
      },
      {
        "id": "FN0306",
        "name": "First Extender",
        "parentName": "WLAN Extender Option"
      }
    ],
    "conditionsHumanReadable": [
      "Customer already owns item in \"FN0310: Super WLAN Extender I\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007043": {
    "ruleId": "CR007043",
    "ruleName": "ILS: Allow SuperWLAN additional extender",
    "businessDefinition": "ILS: Allow Super WLAN additional extender.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Super WLAN additional Extender\" (FN0312), \"Additional Extender\" (FN0308), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0312",
        "name": "Super WLAN additional Extender",
        "parentName": "Super WLAN Extender"
      },
      {
        "id": "FN0308",
        "name": "Additional Extender",
        "parentName": "WLAN Extender Option"
      }
    ],
    "conditionsHumanReadable": [
      "Customer already owns item in \"FN0312: Super WLAN additional Extender\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007045": {
    "ruleId": "CR007045",
    "ruleName": "MOV121: Removal of products from FN21 Options is not allowed",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [MOV121] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Options\" (FN21), THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOV121"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [
      {
        "id": "FN21",
        "name": "Options",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.hasProcessContext(\"MOV121\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007072": {
    "ruleId": "CR007072",
    "ruleName": "MOVBLU: Remove existing BB DSL 16000 if not available at target location ",
    "businessDefinition": "Remove existing bandwidth in MOVBLU if BB DSL 16000 is not available at target location.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Line technology check: 16000, null, null, \"GRUEN,GRUEN_GRAU,GELB\"",
      "installBase.containsProduct(\"V018C\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007074": {
    "ruleId": "CR007074",
    "ruleName": "Installed base contains Basis Access and 02/19 tariffs selected",
    "businessDefinition": "Installed base contains basis access and 02/19 tariffs selected.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Basic Access\" (FN78), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN78",
        "name": "Basic Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")",
      "Customer already owns item in \"FN78: Basic Access\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007076": {
    "ruleId": "CR007076",
    "ruleName": "Installed base contains Komfort Access and 02/19 tariffs selected",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"Comfort Access\" (FN79), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "Customer already owns item in \"FN79: Comfort Access\"",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007078": {
    "ruleId": "CR007078",
    "ruleName": "Re-launch Startguthaben (Dealcloser)",
    "businessDefinition": "Re-launch Startguthaben (Dealcloser).",
    "plainLanguageIntent": "During [ACQ, MIGCOC] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"DSL Package\" (FN76), \"24 Months packages\" (FN0355), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0355",
        "name": "24 Months packages",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN76: DSL Package\"",
      "Package includes item in \"FN0355: 24 Months packages\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007080": {
    "ruleId": "CR007080",
    "ruleName": "MOVBLU: Remove existing BB DSL 25000 or DSL 50000 if not available at target location ",
    "businessDefinition": "Remove existing bandwidth in MOVBLU if BB DSL 25000 or DSL 50000 are not available at target location.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Line technology check: 25000, null, null, \"GRUEN\"",
      "installBase.containsProduct(\"V018G\") OR installBase.containsProduct(\"V018H\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007082": {
    "ruleId": "CR007082",
    "ruleName": "MOVBLU: Remove existing BB DSL 100000 if not available at target location ",
    "businessDefinition": "Remove existing bandwidth in MOVBLU if BB DSL 100000 is not available at target location.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Line technology check: 100000, null, null, \"GRUEN\"",
      "installBase.containsProduct(\"V018N\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007084": {
    "ruleId": "CR007084",
    "ruleName": "MOVBLU: Remove existing BB DSL 175000 or DSL 250000 if not available at target location ",
    "businessDefinition": "Remove existing bandwidth in MOVBLU if BB DSL 175000 or DSL 250000 are not available at target location.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Line technology check: 175000, null, \"IP-Bitstream,IP-Bitstream ADSL,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "installBase.containsProduct(\"V018U\") OR installBase.containsProduct(\"V018V\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007086": {
    "ruleId": "CR007086",
    "ruleName": "Allow old combined flat options - 02/19 portfolio",
    "businessDefinition": "Allow old combined flat options - 02/19 portfolio.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"combined Flat Options\" (FN128), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN128",
        "name": "combined Flat Options",
        "parentName": "Voice Flat Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007088": {
    "ruleId": "CR007088",
    "ruleName": "Allow Vodafone Flat - 02/19 Portfolio",
    "businessDefinition": "Allow Vodafone Flat - 02/19 portfolio.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007090": {
    "ruleId": "CR007090",
    "ruleName": "MOVBLU: Remove existing FIBRE 1000000 BB if not available at target location ",
    "businessDefinition": "Remove existing bandwidth in MOVBLU if FIBRE 1000000 is not available at target location.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"fibreInternetConfiguration\" (FN219), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      }
    ],
    "conditionsHumanReadable": [
      "!Line technology check: 1000000, null, \"FTTH-GPON,FTTH-L2-BSA-DTAG,FTTH-L2-BSA\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "Customer already owns item in \"FN219: fibreInternetConfiguration\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007098": {
    "ruleId": "CR007098",
    "ruleName": "Not Allow V1209 and V1208 options - 02/19 Portfolio",
    "businessDefinition": "Not Allow V1209 and V1208 options - 02/19 Portfolio.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007110": {
    "ruleId": "CR007110",
    "ruleName": "MOVBLU: Removal of contract prolongation is not allowed ",
    "businessDefinition": "Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is LOCKED TO PREVENT REMOVAL from the existing subscription.",
    "archetype": "retention_lock",
    "archetypeLabel": "Equipment Retention Lock",
    "policyTag": "Installed Base Retention Lock",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Removal Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007112": {
    "ruleId": "CR007112",
    "ruleName": "GigaZuhause 150 Glasfaser 12M Wechselgarantie package allowed ",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"Double Play Package\" (FN74), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN74",
        "name": "Double Play Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "customer.tariffIsInDay() > 365",
      "Customer already owns item in \"FN74: Double Play Package\"",
      "installBase.containsProduct(\"FTTH-GPON\")",
      "Cart contains product \"R219.5000000011-24\" OR Cart contains product \"R219.5000000012-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007114": {
    "ruleId": "CR007114",
    "ruleName": "GigaZuhause 300 Glasfaser 12M Wechselgarantie package allowed ",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed Fiber / GPON bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (5 conditions) are satisfied involving Category \"Double Play Package\" (FN74), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN74",
        "name": "Double Play Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "Cart contains product \"R219.5000000012-24\"",
      "customer.tariffIsInDay() > 365",
      "Customer already owns item in \"FN74: Double Play Package\"",
      "installBase.containsProduct(\"FTTH-GPON\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007123": {
    "ruleId": "CR007123",
    "ruleName": "24x10 Sonderpromo for Basic 150 Glasfaser - CHAM Project Reference",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ACQ, ILSBLU, MIGCOC, MOVBLU] on [DSL]: IF evaluation criteria (4 conditions) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is pre-selected as the RECOMMENDED DEFAULT (customer may opt out).",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ACQ",
      "ILSBLU",
      "MIGCOC",
      "MOVBLU"
    ],
    "operationValue": "Defaulted",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: 1000000, null, \"FTTH-GPON\", \"GRUEN\"",
      "Cart contains product \"R025.5000000527-24\"",
      "!cart.package.hasProcessContext(\"ILSBLU\") OR Customer already owns item in \"FN76: DSL Package\"",
      "availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_1_2020_09)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_2_2021_01)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_3_2021_04)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_6_2022_03)\") OR availability.hasHighestPriority(1000000, \"GRUEN,GRUEN_GRAU,GELB\", \"FTTH-GPON\", \"FIBRE\", \"(PROJECT_REFERENCE;CHAM_7_2022_03)\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007125": {
    "ruleId": "CR007125",
    "ruleName": "Allow - Fibre hardware for backoffice booking (status Legacy)",
    "businessDefinition": "Allow - Fibre legacy hardware for backoffice booking.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"FIBRE\" (FN210), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "Cart contains product 10018",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007127": {
    "ruleId": "CR007127",
    "ruleName": "Not Allow - Fibre hardware for backoffice booking (status Live)",
    "businessDefinition": "Not Allow - Fibre hardwares for backoffice booking (status Live).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"FIBRE\" (FN210), THEN the target item is marked as [Not Allowed].",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "Cart contains product 10018",
      "cart.package.hasProductWithVersion(\"R219.5000000014-24\", \"equals\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007130": {
    "ruleId": "CR007130",
    "ruleName": "Allow new fibre hardwares (legacy) for 10/25 portfolio - BackOffice booking",
    "businessDefinition": "Allow new fibre hardwares (legacy) for 10/25 portfolio - backoffice booking.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied involving Category \"FN0663\" (FN0663), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0663",
        "name": "FN0663",
        "parentName": null
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals true",
      "cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"equals\")",
      "Cart contains product 10018"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007157": {
    "ruleId": "CR007157",
    "ruleName": "Existing Fiber regio fee not allowed in case of MOVE",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Fibre Regio Fee\" (FN0617), THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [
      {
        "id": "FN0617",
        "name": "Fibre Regio Fee",
        "parentName": "Fee"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007159": {
    "ruleId": "CR007159",
    "ruleName": "FTTH-GPON not allowed if not highest availability",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-GPON\", \"FIBRE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007161": {
    "ruleId": "CR007161",
    "ruleName": "FTTH-L2-BSA-DTAG not allowed if not highest availabillity",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA-DTAG\", \"FIBRE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007163": {
    "ruleId": "CR007163",
    "ruleName": "FTTH-L2-BSA not allowed if not highest availabillity",
    "businessDefinition": "Enforces technical hardware compatibility on Fiber / GPON: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!availability.hasHighestPriority(1000000, \"GRUEN\", \"FTTH-L2-BSA\", \"FIBRE\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007165": {
    "ruleId": "CR007165",
    "ruleName": "MOVBLU: BB 100000 at all DSL-100000 allowed",
    "businessDefinition": "Allow bandwidth 100 if a bandwidth service of category Package with Bandwidth 1000 in cart and 100 is available for MOVBLU (Tracked under Jira DSL-100000).",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (2 conditions) are satisfied involving Category \"Package sellable with Bandwidth 100000 DSL\" (FN69), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira DSL-100000 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN69",
        "name": "Package sellable with Bandwidth 100000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Package includes item in \"FN69: Package sellable with Bandwidth 100000 DSL\"",
      "cart.package.isTariffChanged() equals true OR !cart.package.hasProcessContext(\"ILSBLU\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007167": {
    "ruleId": "CR007167",
    "ruleName": "MOVE: Allow Sales package legacy of installed base",
    "businessDefinition": "MOVE: Allow Sales package legacy of installed base.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007169": {
    "ruleId": "CR007169",
    "ruleName": "MOVE: Allow installBase tariffs in status life",
    "businessDefinition": "MOVE: Allow installBase tariffs in status life.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007171": {
    "ruleId": "CR007171",
    "ruleName": "MOVE: Allow Voice options from installedBase legacy",
    "businessDefinition": "MOVE: Allow Voice options from installedBase legacy.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Voice\" (FN42), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN42",
        "name": "Voice",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007173": {
    "ruleId": "CR007173",
    "ruleName": "MOVE: Allow Voice options from installedBase",
    "businessDefinition": "MOVE: Allow voice options from installedBase.",
    "plainLanguageIntent": "During [MOV121, MOVBLU] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Voice\" (FN42), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN42",
        "name": "Voice",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007272": {
    "ruleId": "CR007272",
    "ruleName": "MOVBLU: DSL 250000 in minimum Duration, so no cheaper packages Allowed",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "Line technology check: 250000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "installBase.containsProduct(\"V018V\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007274": {
    "ruleId": "CR007274",
    "ruleName": "MOVBLU: DSL 100000 in minimum Duration, so no cheaper packages Allowed",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "Line technology check: 100000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "installBase.containsProduct(\"V018N\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "CR007276": {
    "ruleId": "CR007276",
    "ruleName": "MOVBLU: DSL 50000 in minimum Duration, so no cheaper packages Allowed",
    "businessDefinition": "Enforces technical hardware compatibility on DSL Broadband: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration.",
    "plainLanguageIntent": "During [MOVBLU] on [DSL]: IF evaluation criteria (3 conditions) are satisfied, THEN the target item is marked as [Not Allowed].",
    "archetype": "technical_compatibility",
    "archetypeLabel": "Technical Compatibility & Exclusion",
    "policyTag": "Mutual Exclusivity & Hardware Conflict",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "MOVBLU"
    ],
    "operationValue": "Not Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.tariffInMinimumDuration() equals true",
      "Line technology check: 50000, null, \"IP-Bitstream,L2-BSA VDSL,IP-Bitstream VDSL,NGN-DSL,NGN-VDSL\", \"GRUEN,GRUEN_GRAU,GELB\"",
      "installBase.containsProduct(\"V018H\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "SR000003": {
    "ruleId": "SR000003",
    "ruleName": "Komfort-Anschluss kostenlos mit FRITZ!Box (NGN + FTTH Wholebuy)",
    "businessDefinition": "SR000003 - Komfort-Anschluss kostenlos For FTTH Wholebuy, set P-0316-04 (Tracked under Jira OREF-919).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Internet NGN\" (FN142), \"Internet FTTH-Telekom\" (FN0454), \"Internet FTTH Wholebuy\" (FN0499), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-919 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN142",
        "name": "Internet NGN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN0454",
        "name": "Internet FTTH-Telekom",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN0499",
        "name": "Internet FTTH Wholebuy",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      },
      {
        "id": "FN0527",
        "name": "current hardware for Komfort Goody",
        "parentName": "Hardware for Komfort-Goody"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN142: Internet NGN\") OR cart.containsProductInCategoryId(\"FN0454: Internet FTTH-Telekom\") OR cart.containsProductInCategoryId(\"FN0499: Internet FTTH Wholebuy\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "SR000026": {
    "ruleId": "SR000026",
    "ruleName": "Move Offnet Access",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL Package\" (FN76), \"LTE Package\" (FN77), \"Fibre Package FIBRE\" (FN186), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN77",
        "name": "LTE Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN115",
        "name": "Access Installation Fee",
        "parentName": "Installation Fee"
      }
    ],
    "conditionsHumanReadable": [
      "!Cart contains product \"FTTH-L2-BSA-DTAG\" AND (cart.containsProductInCategoryId(\"FN76: DSL Package\") OR cart.containsProductInCategoryId(\"FN77: LTE Package\") OR cart.containsProductInCategoryId(\"FN186: Fibre Package FIBRE\"))"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "SR000045": {
    "ruleId": "SR000045",
    "ruleName": "GS_60MM_5_00(br) Remove",
    "businessDefinition": "SR000045 - GS_60MM_5_00(br).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseProduct(\"V0292TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "SR000046": {
    "ruleId": "SR000046",
    "ruleName": "GS_VF-FLAT_4.99E[br]EOL Remove",
    "businessDefinition": "SR000046 - GS_VF-FLAT_4.99E[br]EOL.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseProduct(\"V1200TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.211Z"
  },
  "SR000052": {
    "ruleId": "SR000052",
    "ruleName": "GS_AIO2_MoFu-Flat_14_99E[br] Remove",
    "businessDefinition": "SR000052 - Remove old MoFuFlat for GiKo.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseProduct(\"V0986TO\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR000066": {
    "ruleId": "SR000066",
    "ruleName": "Test for Backoffice Marker",
    "businessDefinition": "SR000066 - Red Internet & Phone 500 Glasfaser 12 Monate zu 34,99 Euro, danach 44,99 Euro.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\" AND Cart contains product \"10018\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR000078": {
    "ruleId": "SR000078",
    "ruleName": "LS_TAL-Zuschlag_1_39E[br]EOL Remove",
    "businessDefinition": "SR000078 - Remove TAL additional charge in case of TAL to Bitstream change.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Internet Bitstream\" (FN143), \"Internet ISDN\" (FN141), \"Internet NGN\" (FN142), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN143",
        "name": "Internet Bitstream",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN141",
        "name": "Internet ISDN",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN142",
        "name": "Internet NGN",
        "parentName": "Internet Access Technology"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN143: Internet Bitstream\") AND (cart.packageContainedInstalledBaseCategoryId(\"FN141: Internet ISDN\") OR cart.packageContainedInstalledBaseCategoryId(\"FN142: Internet NGN\"))"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR000081": {
    "ruleId": "SR000081",
    "ruleName": "Red Internet & Phone 250 Glasfaser 12 Monate zu 34,99 Euro",
    "businessDefinition": "SR000081 - CCB-CU-035362: DSL/LTE to Fibre change: check based on technology using category adslInternetConfiguration (Tracked under Jira CU-035362).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira CU-035362 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR000084": {
    "ruleId": "SR000084",
    "ruleName": "Re-sale Credit Check Hint",
    "businessDefinition": "SR000084 - Datenschutzhinweis für alle shops im retail channel.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "customer_eligibility",
    "archetypeLabel": "Customer & Line Eligibility",
    "policyTag": "Customer Qualification Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR000096": {
    "ruleId": "SR000096",
    "ruleName": "Red Internet & Phone 500 Glasfaser 12 Monate zu 34,99 Euro, danach 44,9 Euro",
    "businessDefinition": "SR000096 - CCB-CU-035362: DSL/LTE to Fibre change: check based on technology using category adslInternetConfiguration (Tracked under Jira CU-035362).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira CU-035362 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR000097": {
    "ruleId": "SR000097",
    "ruleName": "Red Internet & Phone 750 Glasfaser 12 Monate zu 34,99 Euro, danach 59,99 Euro",
    "businessDefinition": "SR000097 - CCB-CU-035362: DSL/LTE to Fibre change: check based on technology using category adslInternetConfiguration (Tracked under Jira CU-035362).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira CU-035362 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR000098": {
    "ruleId": "SR000098",
    "ruleName": "Red Internet & Phone 1000 Glasfaser 12 Monate zu 34,99 Euro, danach 69,99 Euro",
    "businessDefinition": "SR000098 - CCB-CU-035362: DSL/LTE to Fibre change: check based on technology using category adslInternetConfiguration (Tracked under Jira CU-035362).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira CU-035362 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR007011": {
    "ruleId": "SR007011",
    "ruleName": "Glasfaser Red Internet 100 Tariff change remove Promo",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "!Cart contains product \"R219.5000000002-24\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR022011": {
    "ruleId": "SR022011",
    "ruleName": "Gigakombi broken bundle DSL package",
    "businessDefinition": "SR022011 - Giko: Remove all DSL goodies when Gigakombi bundle gets broken due to tariff change in DSL package.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Bundle Tariff Options\" (FN51), \"DSL_total\" (FN155), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN51",
        "name": "Bundle Tariff Options",
        "parentName": "Bundle Options"
      },
      {
        "id": "FN155",
        "name": "DSL_total",
        "parentName": "FN_Bundle Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainsProductInCategoryId(\"FN51: Bundle Tariff Options\") AND !cart.packageContainsProductInCategoryId(\"FN155: DSL_total\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR037011": {
    "ruleId": "SR037011",
    "ruleName": "Gigakombi broken bundle Mobile package",
    "businessDefinition": "SR037011 - Giko: Remove all DSL goodies when Gigakombi bundle gets broken due to tariff change in Mobile package.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Bundle Tariff Options\" (FN51), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN51",
        "name": "Bundle Tariff Options",
        "parentName": "Bundle Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainsProductInCategoryId(\"FN51: Bundle Tariff Options\") AND cart.containsPackageCreationTypeId(\"Postpaid\") AND !Cart contains item in \"Bundle->Mobile_total\" AND cart.containedProductInCategory(\"Bundle->Mobile_total\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR056011": {
    "ruleId": "SR056011",
    "ruleName": "Hint on cable availability at the current adress",
    "businessDefinition": "SR056011 - Es wird ein Hinweistext angezeigt, wenn an einer Adresse mit Kabel-Verfügbarkeit ein DSL Paket in den Warenkorb gelegt wird. Extended the logic with OXG cause of OS-62117. (Tracked under Jira OS-62117).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OS-62117 / Commercial Policy",
    "domain": "Cable Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "(!Line technology check: null, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\")) AND Cart contains product \"IPR01\" AND cart.containsProductInCategoryId(\"FN76: DSL Package\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR109011": {
    "ruleId": "SR109011",
    "ruleName": "Remove shipping costs",
    "businessDefinition": "SR109011 - remove shipping costs in case of winback or stay combined with sku 10013 (keine Versandkosten).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR142011": {
    "ruleId": "SR142011",
    "ruleName": "Komfort-Anschluss kostenlos mit FRITZ!Box (DSL-NGN + GPON)",
    "businessDefinition": "SR142011 - Komfort-Anschluss kostenlos, Für GPON P-0316-03 (Tracked under Jira OREF-919).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Internet Bitstream\" (FN143), \"Internet FTTH-GPON\" (FN220), \"Comfort Access\" (FN79), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-919 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN143",
        "name": "Internet Bitstream",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN220",
        "name": "Internet FTTH-GPON",
        "parentName": "Internet Access Technology"
      },
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      },
      {
        "id": "FN0527",
        "name": "current hardware for Komfort Goody",
        "parentName": "Hardware for Komfort-Goody"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN143: Internet Bitstream\") OR cart.containsProductInCategoryId(\"FN220: Internet FTTH-GPON\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR144011": {
    "ruleId": "SR144011",
    "ruleName": "Cham Neuvertrags-Promo GS_Glas_RedI100_24x10E[br]",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR146011": {
    "ruleId": "SR146011",
    "ruleName": "Cham Bestandskunden: Promo GS_Glas_RedI100_24x10E[br]",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR151011": {
    "ruleId": "SR151011",
    "ruleName": "Hint Super WLAN Fritz!Box Buchung",
    "businessDefinition": "SR151011 - Secure Net+ show message with Secure Net+ in cart and hardware not Secure Net+ Family Feature ready.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Super WLAN Options\" (FN0302), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0302",
        "name": "Super WLAN Options",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainsProductInCategoryId(\"FN0302: Super WLAN Options\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR247011": {
    "ruleId": "SR247011",
    "ruleName": "Move Offnet Gutschrift Bereitstellungsentgelt 06/23",
    "businessDefinition": "Enforces mandatory attachment policy for DSL Broadband: Automatically includes essential hardware, delivery, or connection components required for order fulfillment (Tracked under Jira OREF-530).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Fibre Packages Wholebuy Bitstream\" (FN0463), \"12 Months packages\" (FN0353), \"Access Installation Fee\" (FN115), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "mandatory_attachment",
    "archetypeLabel": "Mandatory Attachment / Fee",
    "policyTag": "Mandatory Equipment & Fee Attachment",
    "regulatoryRef": "Jira OREF-530 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0463",
        "name": "Fibre Packages Wholebuy Bitstream",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0353",
        "name": "12 Months packages",
        "parentName": "Sales Package"
      },
      {
        "id": "FN115",
        "name": "Access Installation Fee",
        "parentName": "Installation Fee"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN0463: Fibre Packages Wholebuy Bitstream\") AND !cart.containsProductInCategoryId(\"FN0353: 12 Months packages\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR274011": {
    "ruleId": "SR274011",
    "ruleName": "GigaZuhause 50 DSL - 50 Euro Startguthaben",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-437).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-437 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"R708.2000000017-24\" AND !Cart contains product \"GS_WoWi_5E[br]EOL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR276011": {
    "ruleId": "SR276011",
    "ruleName": "GigaZuhause 100 DSL - 80 Euro Startguthaben",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-437).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-437 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"R708.2000000019-24\" AND !Cart contains product \"GS_WoWi_5E[br]EOL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR278011": {
    "ruleId": "SR278011",
    "ruleName": "GigaZuhause 250 DSL - 100 Euro Startguthaben",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice (Tracked under Jira OREF-437).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Jira OREF-437 / Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"R708.2000000020-24\" AND !Cart contains product \"GS_WoWi_5E[br]EOL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR369011": {
    "ruleId": "SR369011",
    "ruleName": "Remove GigaKombi Flat in case tariff change and cart contains Gigakombi Marker",
    "businessDefinition": "SR369011 - GigaKombi Redesign, step1 delete voiceFlat only once, step2, delete old GigaKombi Marker.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() AND Cart contains product \"V0987TO\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR371011": {
    "ruleId": "SR371011",
    "ruleName": "Unbekanntes Paket concerning business customers message hint",
    "businessDefinition": "SR371011 - Show message hint in case customer having an invalid sales package.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "installBase.containsProduct(\"R70.1000000129-24\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR394011": {
    "ruleId": "SR394011",
    "ruleName": "Access numbers restricted after downgrade",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Comfort Access\" (FN79), \"Basic Access\" (FN78), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      },
      {
        "id": "FN78",
        "name": "Basic Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN79: Comfort Access\") AND cart.packageContainsProductInCategoryId(\"FN78: Basic Access\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR419011": {
    "ruleId": "SR419011",
    "ruleName": "ILS Komfort Anschluss kostenlos",
    "businessDefinition": "SR419011 - Komfort-Anschluss kostenlos bei Neubuchung FRITZ!Box xx90 OR upgrade vom Basis Anschluss auf Komfort-Anschluss.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Comfort Access\" (FN79), \"current hardware for Komfort Goody\" (FN0527), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      },
      {
        "id": "FN0527",
        "name": "current hardware for Komfort Goody",
        "parentName": "Hardware for Komfort-Goody"
      }
    ],
    "conditionsHumanReadable": [
      "!installBase.containsProductInCategoryId(\"FN79: Comfort Access\") AND !Cart contains product \"C_comfort\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR449011": {
    "ruleId": "SR449011",
    "ruleName": "Remove 20090213_sub",
    "businessDefinition": "SR449011 - If cart contains product of category FN0485 then remove ONT hardware.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Telekom GF Router mit int-Modem\" (FN0485), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0485",
        "name": "Telekom GF Router mit int-Modem",
        "parentName": "Telekom GF BK HW-Liste"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN0485: Telekom GF Router mit int-Modem\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR451011": {
    "ruleId": "SR451011",
    "ruleName": "KEINE DSL DOPPELBUCHUNG MÖGLICH",
    "businessDefinition": "SR451011 - Show message hint in case DSL Doppelbuchung.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"DSL Package\" (FN76), \"Fibre Package FIBRE\" (FN186), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProductInCategoryId(\"FN20: Sales Package\") AND (cart.containsProductInCategoryId(\"FN76: DSL Package\") OR (cart.containsProductInCategoryId(\"FN186: Fibre Package FIBRE\") AND Line technology check: \"1000000\",null, \"FTTH-GPON, FTTH-L2-BSA-DTAG, FTTH-L2-BSA\", \"GRUEN,GELB\"))"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR453011": {
    "ruleId": "SR453011",
    "ruleName": "Disable CheckIn Button",
    "businessDefinition": "SR453011 - Remove salesPackage in case second dsl package, with expeception on availability preMarketing and Nachverdichtung.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), \"DSL Package\" (FN76), \"Fibre Package FIBRE\" (FN186), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      },
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN43",
        "name": "Internet",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProductInCategoryId(\"FN20: Sales Package\") AND (cart.containsProductInCategoryId(\"FN76: DSL Package\") OR (cart.containsProductInCategoryId(\"FN186: Fibre Package FIBRE\") AND Line technology check: \"1000000\",null, \"FTTH-GPON, FTTH-L2-BSA-DTAG, FTTH-L2-BSA\", \"GRUEN,GELB\"))"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR480011": {
    "ruleId": "SR480011",
    "ruleName": "Hint: bei OXG Verfügbarkeit ",
    "businessDefinition": "SR480011 - OXG-Pop Up window in StandardSale and Redesification, throw Warning message, if DSL Tairf > 50Mbit is selected by agent..",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Package sellable with BB greater 50000 DSL\" (FN0541), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0541",
        "name": "Package sellable with BB greater 50000 DSL",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "Line technology check: null, null, \"FTTH-L2-BSA\", \"GRUEN,ORANGE\", \"(ACCESS_SUPPLIER;OXGG\") AND cart.containsProductInCategoryId(\"FN0541: Package sellable with BB greater 50000 DSL\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR483011": {
    "ruleId": "SR483011",
    "ruleName": "New Hardware Promo - FTTH GigaGemeinde: FRITZ!Box 7690 rental fee is free for 12 months",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Access Hardware\" (FN158), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\" AND cart.packageContainsNewProduct(\"20090258_sub\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR485011": {
    "ruleId": "SR485011",
    "ruleName": "New Hardware Promo -  FTTH GPON: FRITZ!Box 7690 (Mietgerät) rental fee is free for 12 months (Existing Customers)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Access Hardware\" (FN158), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\" AND cart.packageContainsNewProduct(\"20090230_sub\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR491011": {
    "ruleId": "SR491011",
    "ruleName": "ILS: FTTH GPON - GS_HW_Miete_12x9.99E[br] promo for FRITZ!Box 7690 change from DSL",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL Package\" (FN76), \"Access Hardware\" (FN158), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProductInCategoryId(\"FN76: DSL Package\") AND Cart contains product \"FTTH-GPON\" AND !installBase.containsProduct(\"20090258_sub\") AND Cart contains product \"20090258_sub\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR515011": {
    "ruleId": "SR515011",
    "ruleName": "VFP Priority Error hint - DTAG/DG/OXG",
    "businessDefinition": "SR515011 - VFP Priority Error hint - DTAG/DGW/OXG.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "(installBase.containsProduct(\"10041\") AND (Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN\", \"(ACCESS_SUPPLIER;DGW\") OR Line technology check: 1000000, null, \"FTTH-L2-BSA-DTAG\", \"GRUEN\", \"(ACCESS_SUPPLIER;DTAG\"))) OR (installBase.containsProduct(\"10042\") AND (Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN\", \"(ACCESS_SUPPLIER;DGW\") OR Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN\", \"(ACCESS_SUPPLIER;OXGG\"))) OR (installBase.containsProduct(\"10043\") AND (Line technology check: 1000000, null, \"FTTH-L2-BSA-DTAG\", \"GRUEN\", \"(ACCESS_SUPPLIER;DTAG\") OR Line technology check: 1000000, null, \"FTTH-L2-BSA\", \"GRUEN\", \"(ACCESS_SUPPLIER;OXGG\")))"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR531011": {
    "ruleId": "SR531011",
    "ruleName": "Hint DSL - The Old GigaKombi Marker customers will loose tariff option on a tariff change ",
    "businessDefinition": "SR531011 - DSL customers - In case of a tariff change for a customer with an existing old GigaKombi marker (either SKU V0987TO or V0986TO), the agent will get a message that the GigaKombi benefit \"Mobile & Euro-Flat\" is no longer available.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL Package\" (FN76), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "(installBase.containsProduct(\"V0987TO\") OR installBase.containsProduct(\"V0986TO\")) AND cart.package.isTariffChanged() AND !Cart contains product \"10016\" AND cart.containsProductInCategoryId(\"FN76: DSL Package\") AND cart.containsProductInCategoryId(\"FN20: Sales Package\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR536011": {
    "ruleId": "SR536011",
    "ruleName": "GigaKombi Kulanz-Gutschrift",
    "businessDefinition": "SR536011 - GigaKombi Kulanz-Gutschrift.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Bundle Tariff Options\" (FN51), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN51",
        "name": "Bundle Tariff Options",
        "parentName": "Bundle Options"
      }
    ],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR573011": {
    "ruleId": "SR573011",
    "ruleName": "HINT: On higher price for defaulted tariff options",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() AND cart.containsProductInCategoryId(\"FN76: DSL Package\") AND (cart.packageContainedInstalledBaseProduct(\"V1206TO\") OR cart.packageContainedInstalledBaseProduct(\"V1207TO\"))"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR576011": {
    "ruleId": "SR576011",
    "ruleName": "Hint: FTTH - The Old GigaKombi Marker customers will loose tariff option on a tariff change ",
    "businessDefinition": "SR576011 - FTTH customers - In case of a tariff change for a customer with an existing old GigaKombi marker (either SKU V0987TO or V0986TO), the agent will get a message that the GigaKombi benefit \"Mobile & Euro-Flat\" is no longer available.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"DSL Package\" (FN76), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN76",
        "name": "DSL Package",
        "parentName": "Sales Package"
      }
    ],
    "conditionsHumanReadable": [
      "(installBase.containsProduct(\"V0987TO\") OR installBase.containsProduct(\"V0986TO\")) AND cart.package.isTariffChanged() AND !Cart contains product \"10016\" AND !cart.containsProductInCategoryId(\"FN76: DSL Package\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR579011": {
    "ruleId": "SR579011",
    "ruleName": "9 month promo for GigaZuhause 16 DSL",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR583011": {
    "ruleId": "SR583011",
    "ruleName": "9 month promo for GigaZuhause 100 DSL",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR585011": {
    "ruleId": "SR585011",
    "ruleName": "9 month promo for GigaZuhause 250 DSL",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR587011": {
    "ruleId": "SR587011",
    "ruleName": "9 month promo for GigaZuhause 150 Wholebuy",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR589011": {
    "ruleId": "SR589011",
    "ruleName": "9 month promo for GigaZuhause 300 Wholebuy",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR591011": {
    "ruleId": "SR591011",
    "ruleName": "9 month promo for GigaZuhause 600 Wholebuy",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR593011": {
    "ruleId": "SR593011",
    "ruleName": "9 month promo for GigaZuhause 1000 Wholebuy",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR595011": {
    "ruleId": "SR595011",
    "ruleName": "12 month promo for GigaZuhause 300 GPON",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR597011": {
    "ruleId": "SR597011",
    "ruleName": "12 month promo for GigaZuhause 600 GPON",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR599011": {
    "ruleId": "SR599011",
    "ruleName": "12 month promo for GigaZuhause 1000 GPON",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR601011": {
    "ruleId": "SR601011",
    "ruleName": "Portfolio Wechsel Promo (PWP) 5 Euro dauerhaft",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR603011": {
    "ruleId": "SR603011",
    "ruleName": "Portfolio Wechsel Promo (PWP) 12x5 Euro",
    "businessDefinition": "Enforces Vodafone Wechselgarantie tariff mobility. When high-speed DSL Broadband bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "downgrade_guarantee",
    "archetypeLabel": "Wechselgarantie (Upgrade/Downgrade)",
    "policyTag": "Wechselgarantie Policy",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR605011": {
    "ruleId": "SR605011",
    "ruleName": "ILS: 12 month promo for GZH 1000 GPON (DSL to Fibre)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\") AND Cart contains product \"FTTH-GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR607011": {
    "ruleId": "SR607011",
    "ruleName": "ILS: 12 month promo for GZH 600 GPON (DSL to Fibre)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\") AND Cart contains product \"FTTH-GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR609011": {
    "ruleId": "SR609011",
    "ruleName": "ILS: 12 month promo for GZH 300 GPON (DSL to Fibre)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\") AND Cart contains product \"FTTH-GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR611011": {
    "ruleId": "SR611011",
    "ruleName": "ILS: 9 month promo for GZH 1000 Wholebuy (DSL to Fibre)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\") AND (Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR613011": {
    "ruleId": "SR613011",
    "ruleName": "ILS: 9 month promo for GZH 600 Wholebuy (DSL to Fibre)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\") AND (Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR615011": {
    "ruleId": "SR615011",
    "ruleName": "ILS: 9 month promo for GZH 300 Wholebuy (DSL to Fibre)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\") AND (Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR617011": {
    "ruleId": "SR617011",
    "ruleName": "ILS: 9 month promo for GZH 150 Wholebuy (DSL to Fibre)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"adslInternetConfiguration\" (FN218), \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN218",
        "name": "adslInternetConfiguration",
        "parentName": "SOM Mapping"
      },
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseCategoryId(\"FN218: adslInternetConfiguration\") AND (Cart contains product \"FTTH-L2-BSA-DTAG\" OR Cart contains product \"FTTH-L2-BSA\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR728011": {
    "ruleId": "SR728011",
    "ruleName": "Hint: Ultra Hub 7 Glasfaser includes Super WLAN",
    "businessDefinition": "SR728011 - Hint: Ultra Hub 7 Glasfaser has SuperWLAN.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"FN0655\" (FN0655), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0655",
        "name": "FN0655",
        "parentName": null
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN0655: FN0655\": \"FN0655: FN0655\") AND !installBase.containsProductInCategoryId(\"FN0655: FN0655\": \"FN0655: FN0655\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.212Z"
  },
  "SR745011": {
    "ruleId": "SR745011",
    "ruleName": "Hint: Bandwidth not available at the new location and a tariff change is needed for MOV121",
    "businessDefinition": "SR745011 - In case the existing bandwidth of the old location is not possible at the new location the agent has to be informed with a pop up message that a tariff change is necessary..",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "(installBase.containsProduct(\"V018C\") AND !Line technology check: \"16000\",null, null, \"GRUEN\") OR (installBase.containsProduct(\"V018H\") AND !Line technology check: \"50000\",null, null, \"GRUEN\") OR (installBase.containsProduct(\"V018N\") AND !Line technology check: \"100000\",null, null, \"GRUEN\") OR (installBase.containsProduct(\"V018V\") AND !Line technology check: \"250000\",null, null, \"GRUEN\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR753011": {
    "ruleId": "SR753011",
    "ruleName": "Hint: FTTH-Bandwidth not available at the new location and a tariff change is needed for MOV121",
    "businessDefinition": "SR753011 - FTTH: In case the existing bandwidth of the old location is not possible at the new location the agent has to be informed with a pop up message that a tariff change is necessary..",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"fibreInternetConfiguration\" (FN219), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProductInCategoryId(\"FN219: fibreInternetConfiguration\") AND !Line technology check: \"1000000\",null, null, \"GRUEN\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR755011": {
    "ruleId": "SR755011",
    "ruleName": "Hint: FTTH-Bandwidth not available at the new location and a tariff change is needed for MOVBLU",
    "businessDefinition": "SR755011 - FTTH: In case the existing bandwidth of the old location is not possible at the new location the agent has to be informed with a pop up message that a tariff change is necessary..",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"fibreInternetConfiguration\" (FN219), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN219",
        "name": "fibreInternetConfiguration",
        "parentName": "SOM Mapping"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProductInCategoryId(\"FN219: fibreInternetConfiguration\") AND !Line technology check: \"1000000\",null, null, \"GRUEN\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR759011": {
    "ruleId": "SR759011",
    "ruleName": "Hint: Bandwidth not available at the new location and a tariff change is needed for MOVBLU",
    "businessDefinition": "SR759011 - In case the existing bandwidth of the old location is not possible at the new location the agent has to be informed with a pop up message that a tariff change is necessary..",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "(installBase.containsProduct(\"V018C\") AND !Line technology check: \"16000\",null, null, \"GRUEN\") OR (installBase.containsProduct(\"V018H\") AND !Line technology check: \"50000\",null, null, \"GRUEN\") OR (installBase.containsProduct(\"V018N\") AND !Line technology check: \"100000\",null, null, \"GRUEN\") OR (installBase.containsProduct(\"V018V\") AND !Line technology check: \"250000\",null, null, \"GRUEN\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR775011": {
    "ruleId": "SR775011",
    "ruleName": "GigaZuhause 50 DSL 24M - Aktionsgutschrift 10 Euro",
    "businessDefinition": "SR775011 - GigaZuhause 50 DSL 24M - Aktionsgutschrift 10 Euro.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Sales Package\" (FN20), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "pricing_discount",
    "archetypeLabel": "Pricing & Discounts",
    "policyTag": "Pricing & Promotional Waiver",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN20",
        "name": "Sales Package",
        "parentName": "Business Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR817011": {
    "ruleId": "SR817011",
    "ruleName": "Promo for all Fibre except GPON 24-Months packages and all Wholebuy partner",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Fibre Package FIBRE\" (FN186), \"24 Months packages\" (FN0355), \"Access Installation Fee\" (FN115), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN186",
        "name": "Fibre Package FIBRE",
        "parentName": "Sales Package"
      },
      {
        "id": "FN0355",
        "name": "24 Months packages",
        "parentName": "Sales Package"
      },
      {
        "id": "FN115",
        "name": "Access Installation Fee",
        "parentName": "Installation Fee"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN186: Fibre Package FIBRE\") AND cart.containsProductInCategoryId(\"FN0355: 24 Months packages\") AND !Cart contains product \"FTTH-GPON\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR819011": {
    "ruleId": "SR819011",
    "ruleName": "Promo for all GPON 24-Months packages and all Wholebuy partner",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"24 Months packages\" (FN0355), \"Access Installation Fee\" (FN115), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0355",
        "name": "24 Months packages",
        "parentName": "Sales Package"
      },
      {
        "id": "FN115",
        "name": "Access Installation Fee",
        "parentName": "Installation Fee"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"FTTH-GPON\" AND cart.containsProductInCategoryId(\"FN0355: 24 Months packages\") AND Line technology check: \"1000000\",null, \"FTTH-GPON\", \"GRUEN\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR821011": {
    "ruleId": "SR821011",
    "ruleName": "ACQ: GPON GZH basic 150 Glasfaser - SonderPromo (CHAM)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR824011": {
    "ruleId": "SR824011",
    "ruleName": "ILS: GPON GZH basic 150 Glasfaser - SonderPromo (CHAM)",
    "businessDefinition": "Promotional default setting for Fiber / GPON: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "true"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR826011": {
    "ruleId": "SR826011",
    "ruleName": "New Komfort Anschluss with New FRITZ!Box Rental Hardware",
    "businessDefinition": "SR826011 - Komfort-Anschluss kostenlos mit FRITZ!Box (KomfA new + FRITZ new).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"current hardware for Komfort Goody\" (FN0527), \"Comfort Access\" (FN79), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0527",
        "name": "current hardware for Komfort Goody",
        "parentName": "Hardware for Komfort-Goody"
      },
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"C_comfort\" AND !installBase.containsProductInCategoryId(\"FN0527: current hardware for Komfort Goody\") AND !installBase.containsProductInCategoryId(\"FN79: Comfort Access\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR828011": {
    "ruleId": "SR828011",
    "ruleName": "Existing Komfort Anschluss with New FRITZ!Box Rental Hardware",
    "businessDefinition": "SR828011 - Komfort-Anschluss kostenlos mit FRITZ!Box (KomfA existing+ FRITZ new).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"current hardware for Komfort Goody\" (FN0527), \"Comfort Access\" (FN79), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0527",
        "name": "current hardware for Komfort Goody",
        "parentName": "Hardware for Komfort-Goody"
      },
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"C_comfort\" AND cart.containsProductInCategoryId(\"FN0527: current hardware for Komfort Goody\": current hardware for Komfort Goody\") AND installBase.containsProductInCategoryId(\"FN79: Comfort Access\") AND !installBase.containsProductInCategoryId(\"FN0527: current hardware for Komfort Goody\": current hardware for Komfort Goody\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SR830011": {
    "ruleId": "SR830011",
    "ruleName": "New Komfort Anschluss with Existing FRITZ!Box Rental Hardware",
    "businessDefinition": "SR830011 - Komfort-Anschluss kostenlos mit FRITZ!Box (KomfA new + FRITZ old).",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Hardware for Komfort-Goody\" (FN0525), \"Comfort Access\" (FN79), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0525",
        "name": "Hardware for Komfort-Goody",
        "parentName": "Hardware Class"
      },
      {
        "id": "FN79",
        "name": "Comfort Access",
        "parentName": "Voice Access"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"C_comfort\" AND installBase.containsProductInCategoryId(\"FN0525: Hardware for Komfort-Goody\") AND !installBase.containsProductInCategoryId(\"FN79: Comfort Access\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SRNA0001": {
    "ruleId": "SRNA0001",
    "ruleName": "Remove Versandkosten in case of only Eigenhardware",
    "businessDefinition": "Commercial compatibility rule for DSL Broadband (Remove Versandkosten in case of only Eigenhardware). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Accessory\" (FN169), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN169",
        "name": "Accessory",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"20099900_sub\" AND !cart.containsProductInCategoryId(\"FN169: Accessory\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SRNA0002": {
    "ruleId": "SRNA0002",
    "ruleName": "Hinweis: Keine Winback Promo für Friends&Family Kunden",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Winback and Prolongation\" (FN0319), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN0319",
        "name": "Winback and Prolongation",
        "parentName": "FN_Package Configuration"
      }
    ],
    "conditionsHumanReadable": [
      "cart.containsProductInCategoryId(\"FN0319: Winback and Prolongation\") AND Cart contains product \"GS_Friends_5E[br]EOL\""
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SRNA0003": {
    "ruleId": "SRNA0003",
    "ruleName": "LS_YOUNG_9x5E[br] remove",
    "businessDefinition": "Commercial compatibility rule for DSL Broadband (LS_YOUNG_9x5E[br] remove). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "cart.packageContainedInstalledBaseProduct(\"GS_YOUNG_24x5E[br]\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SRNA0004": {
    "ruleId": "SRNA0004",
    "ruleName": "Hint: that Sicherheitspaket is removed during tariff change",
    "businessDefinition": "Commercial compatibility rule for DSL Broadband (Hint: that Sicherheitspaket is removed during tariff change). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Security Package\" (FN45), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN45",
        "name": "Security Package",
        "parentName": "Options"
      }
    ],
    "conditionsHumanReadable": [
      "installBase.containsProductInCategoryId(\"FN45: Security Package\") AND cart.package.isTariffChanged()"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SRNA0005": {
    "ruleId": "SRNA0005",
    "ruleName": "show error message if agent tries to book another FTTH even there is an open LineCreation",
    "businessDefinition": "Commercial compatibility rule for Fiber / GPON (show error message if agent tries to book another FTTH even there is an open LineCreation). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "customer.hasPendingOrderOfType(\"DSL\",\"LineCreation\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SRNA0006": {
    "ruleId": "SRNA0006",
    "ruleName": "Hint: Remove Winback NBA if there is no Open Termination",
    "businessDefinition": "Commercial compatibility rule for DSL Broadband (Hint: Remove Winback NBA if there is no Open Termination). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "Cart contains product \"10007\" AND !customer.hasPendingOrderOfType(\"DSL\",\"Termination\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "SRNA0007": {
    "ruleId": "SRNA0007",
    "ruleName": "DSL 50 - New EasyBox Hardware Promo",
    "businessDefinition": "Promotional default setting for DSL Broadband: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied involving Category \"Access Hardware\" (FN158), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "promotional_default",
    "archetypeLabel": "Promotional Default (PWP)",
    "policyTag": "Promotional Hardware & Default Setting",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "Cart contains product \"R025.5000000074-24\" AND cart.packageContainsNewProduct(\"20090284_sub\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "nm33": {
    "ruleId": "nm33",
    "ruleName": "NAME33 abc",
    "businessDefinition": "Commercial compatibility rule for DSL Broadband (NAME33 abc). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "helperCustomer.getCharacteristicValue(customer,\"age\")"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "hud1": {
    "ruleId": "hud1",
    "ruleName": "hud1",
    "businessDefinition": "Commercial compatibility rule for DSL Broadband (hud1). Governs allowable tariff and hardware combinations during sales checkout.",
    "plainLanguageIntent": "During [ILSBLU, MOVBLU, ACQ, MIGCOC] on [DSL]: IF evaluation criteria (1 condition) are satisfied, THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Vodafone Commercial Policy",
    "domain": "DSL Broadband",
    "journeyContext": [
      "ILSBLU",
      "MOVBLU",
      "ACQ",
      "MIGCOC"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [],
    "conditionsHumanReadable": [
      "helperCustomer.getCharacteristicValue(customer,\"age\") OR helperCustomer.getCreditProfile_X(customer,0).creditScore >= 200"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  },
  "CR006217": {
    "ruleId": "CR006217",
    "ruleName": "CR006217 - Access HW allowed if HW in installed base in status legacy compatible OREF-342 FTTH-L2-BSA-DTAG added, OREF-389 DG added",
    "businessDefinition": "Access HW allowed if HW in installed base in status legacy compatible FTTH-L2-BSA-DTAG added, DG added (Tracked under Jira OREF-342).",
    "plainLanguageIntent": "During [ILSBLU, MOV121, MOVBLU] on [DSL]: IF evaluation criteria (9 conditions) are satisfied involving Category \"Package sellable with Bandwidth 50000 DSL\" (FN41), \"VDSL Vectoring\" (FN132), \"Package sellable with Bandwidth 250000 DSL\" (FN183), THEN the target item is UNLOCKED AND ALLOWED for customer selection.",
    "archetype": "sales_journey",
    "archetypeLabel": "Sales Journey & Compatibility",
    "policyTag": "Commercial Compatibility Standard",
    "regulatoryRef": "Jira OREF-342 / Commercial Policy",
    "domain": "Fiber / GPON",
    "journeyContext": [
      "ILSBLU",
      "MOV121",
      "MOVBLU"
    ],
    "operationValue": "Allowed",
    "referencedCategories": [
      {
        "id": "FN41",
        "name": "Package sellable with Bandwidth 50000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN132",
        "name": "VDSL Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN183",
        "name": "Package sellable with Bandwidth 250000 DSL",
        "parentName": "Sales Package"
      },
      {
        "id": "FN137",
        "name": "VDSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN31",
        "name": "Internet Access Technology",
        "parentName": "Technlogy Configuration"
      },
      {
        "id": "FN0479",
        "name": "Telekom GF BK HW-Liste",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN199",
        "name": "VDSL Super Vectoring",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN210",
        "name": "FIBRE",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN138",
        "name": "ADSL",
        "parentName": "Access Hardware"
      },
      {
        "id": "FN158",
        "name": "Access Hardware",
        "parentName": "Hardware Capability"
      }
    ],
    "conditionsHumanReadable": [
      "cart.package.isTariffChanged() equals false",
      "Cart contains item in \"FN41: Package sellable with Bandwidth 50000 DSL\" AND Customer already owns item in \"FN132: VDSL Vectoring\" AND ( availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 1) OR availability.HasAdditionalOption(\"ACCESS_DEVICE_REQUIREMENT\", \"VDSL2-Vectoring\", 50000, null, 2) )",
      "!Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN137: VDSL\" AND ( Cart contains product \"NGN-VDSL\" OR Cart contains product \"IP-Bitstream VDSL\" OR Cart contains product \"L2-BSA VDSL\" )",
      "cart.package.hasProcessContext(\"ILSBLU\") AND !Package includes item in \"FN31: Internet Access Technology\"",
      "Cart contains product \"FTTH-L2-BSA-DTAG\" AND Customer already owns item in \"FN0479: Telekom GF BK HW-Liste\"",
      "Cart contains item in \"FN183: Package sellable with Bandwidth 250000 DSL\" AND Customer already owns item in \"FN199: VDSL Super Vectoring\"",
      "Cart contains product \"FTTH-GPON\" AND Customer already owns item in \"FN210: FIBRE\"",
      "Customer already owns item in \"FN210: FIBRE\" AND Cart contains product \"FTTH-L2-BSA\"",
      "Customer already owns item in \"FN138: ADSL\" AND ( Cart contains product \"NGN-DSL\" OR Cart contains product \"IP-Bitstream\" OR Cart contains product \"IP-Bitstream ADSL\" OR Cart contains product \"NGN-ADSL\" )"
    ],
    "source": "llm_generated",
    "userOverridden": false,
    "lastUpdated": "2026-11-14T00:30:36.213Z"
  }
};
export default RULE_COMMERCIAL_DEFINITIONS;
