const OpenAI = require("openai");
require("dotenv").config();

const apiKey = process.env.API_KEY;

const openai = new OpenAI({
  apiKey: "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",
});

const schemaInterface = `
interface Approval {
    id?: string;
    name: string;
    description?: string;
    objectType: RuleObjectType;
    ruleId?: string;
    ruleOrder?: number;
    expression: Expression;
    approvalSteps: ApprovalStep[];
}

enum ConditionOperator {
    Equal = 'Equal',
    NotEqual = 'NotEqual',
    GreaterThan = 'GreaterThan',
    GreaterEqualThan = 'GreaterEqualThan',
    LessThan = 'LessThan',
    LessEqualThan = 'LessEqualThan',
    IsNull = 'IsNull',
    IsNotNull = 'IsNotNull',
    Exists = 'Exists',
    NotExists = 'NotExists',
    Between = 'Between',
    EqualIgnoreCase = 'EqualIgnoreCase',
    NotEqualIgnoreCase = 'NotEqualIgnoreCase',
    GreaterThanIgnoreCase = 'GreaterThanIgnoreCase',
    GreaterEqualThanIgnoreCase = 'GreaterEqualThanIgnoreCase',
    LessThanIgnoreCase = 'LessThanIgnoreCase',
    LessEqualThanIgnoreCase = 'LessEqualThanIgnoreCase',
    Contains = 'Contains',
    ContainsIgnoreCase = 'ContainsIgnoreCase',
    NotContains = 'NotContains',
    NotContainsIgnoreCase = 'NotContainsIgnoreCase',
    StartsWith = 'StartsWith',
    StartsWithIgnoreCase = 'StartsWithIgnoreCase',
    EndsWith = 'EndsWith',
    EndsWithIgnoreCase = 'EndsWithIgnoreCase',
    MatchContains = 'MatchContains',
    MatchContainsIgnoreCase = 'MatchContainsIgnoreCase',
    MatchEquals = 'MatchEquals',
    MatchEqualsIgnoreCase = 'MatchEqualsIgnoreCase',
    MatchValueEquals = 'MatchValueEquals',
    MatchValueContains = 'MatchValueContains',
    MatchValueContainsIgnoreCase = 'MatchValueContainsIgnoreCase',
    MatchValueEqualsIgnoreCase = 'MatchValueEqualsIgnoreCase',
    MatchNotContains = 'MatchNotContains',
    MatchNotContainsIgnoreCase = 'MatchNotContainsIgnoreCase',
    MatchNotEquals = 'MatchNotEquals',
    MatchNotEqualsIgnoreCase = 'MatchNotEqualsIgnoreCase',
    MatchValueNotContains = 'MatchValueNotContains',
    MatchValueNotContainsIgnoreCase = 'MatchValueNotContainsIgnoreCase',
    MatchValueNotEquals = 'MatchValueNotEquals',
    MatchValueNotEqualsIgnoreCase = 'MatchValueNotEqualsIgnoreCase',
    ContainsKey = 'ContainsKey',
    NotContainsKey = 'NotContainsKey',
    ContainsExact = 'ContainsExact',
    IsEmpty = 'IsEmpty',
    IsNotEmpty = 'IsNotEmpty',
    ContainsAllKeys = 'ContainsAllKeys',
    NotContainsAllKeys = 'NotContainsAllKeys',
    MatchesAllValues = 'MatchesAllValues',
    MatchesAnyValue = 'MatchesAnyValue',
    Matches = 'Matches',
    ContainsAny = 'ContainsAny',
    NotContainsAny = 'NotContainsAny',
    NotMatchesAllValues = 'NotMatchesAllValues',
    NotMatchesAnyValue = 'NotMatchesAnyValue',
    NotMatches = 'NotMatches',
}

interface Condition {
    field: string;
    function?: string;
    operator: ConditionOperator;
    values: string[];
    logical: Logical;
}

interface ConditionGroup {
    conditions: Condition[];
    logical: Logical;
}

interface Expression {
    expr?: string; // free form expression
    conditionGroups?: ConditionGroup[];
}
enum Operator {
    Equal = 'Equal',
    NotEqual = 'NotEqual',
    GreaterThan = 'GreaterThan',
    GreaterEqualThan = 'GreaterEqualThan',
    LessThan = 'LessThan',
    LessEqualThan = 'LessEqualThan',
    IsNull = 'IsNull',
    IsNotNull = 'IsNotNull',
    Exists = 'Exists',
    NotExists = 'NotExists',
    Between = 'Between',
    Like = 'Like',
    iLike = 'iLike',
}

enum Logical {
    And = 'And',
    Or = 'Or',
}
`;

const ruleMetadata = `
[
    {
        "name": "bill.bill.amount",
        "internal": "bill.amount",
        "label": "Amount",
        "dataType": "Double",
        "operators": [
            {
                "conditionOperator": "Equal",
                "label": "Equals"
            },
            {
                "conditionOperator": "NotEqual",
                "label": "Not Equals"
            },
            {
                "conditionOperator": "GreaterThan",
                "label": "Greater Than"
            },
            {
                "conditionOperator": "GreaterEqualThan",
                "label": "Greater or Equal Than"
            },
            {
                "conditionOperator": "LessThan",
                "label": "Less Than"
            },
            {
                "conditionOperator": "LessEqualThan",
                "label": "Less or Equal Than"
            },
            {
                "conditionOperator": "Between",
                "label": "Between"
            }
        ],
        "ruleMetaWidget": {
            "ruleMetaWidgetType": "Text",
            "multi": false
        },
        "ruleMetaValidation": {
            "required": true
        },
        "ruleObjectTypes": [
            "Bill"
        ],
        "functions": [
            {
                "name": "truncate",
                "dataType": "Long",
                "operators": [
                    "Equal",
                    "NotEqual",
                    "GreaterThan",
                    "GreaterEqualThan",
                    "LessThan",
                    "LessEqualThan",
                    "Between"
                ]
            }
        ]
    },
    {
        "name": "bill.bill.billDate",
        "internal": "bill.billDate",
        "label": "Bill Date",
        "dataType": "Date",
        "operators": [
            {
                "conditionOperator": "Equal",
                "label": "Equals"
            },
            {
                "conditionOperator": "NotEqual",
                "label": "Not Equals"
            },
            {
                "conditionOperator": "GreaterThan",
                "label": "Greater Than"
            },
            {
                "conditionOperator": "GreaterEqualThan",
                "label": "Greater or Equal Than"
            },
            {
                "conditionOperator": "LessThan",
                "label": "Less Than"
            },
            {
                "conditionOperator": "LessEqualThan",
                "label": "Less or Equal Than"
            },
            {
                "conditionOperator": "Between",
                "label": "Between"
            }
        ],
        "ruleMetaWidget": {
            "ruleMetaWidgetType": "Calendar",
            "multi": false
        },
        "ruleMetaValidation": {
            "required": true
        },
        "ruleObjectTypes": [
            "Bill"
        ]
    },
    {
        "name": "bill.bill.dueDate",
        "internal": "bill.dueDate",
        "label": "Due Date",
        "dataType": "Date",
        "operators": [
            {
                "conditionOperator": "Equal",
                "label": "Equals"
            },
            {
                "conditionOperator": "NotEqual",
                "label": "Not Equals"
            },
            {
                "conditionOperator": "GreaterThan",
                "label": "Greater Than"
            },
            {
                "conditionOperator": "GreaterEqualThan",
                "label": "Greater or Equal Than"
            },
            {
                "conditionOperator": "LessThan",
                "label": "Less Than"
            },
            {
                "conditionOperator": "LessEqualThan",
                "label": "Less or Equal Than"
            },
            {
                "conditionOperator": "Between",
                "label": "Between"
            }
        ],
        "ruleMetaWidget": {
            "ruleMetaWidgetType": "Calendar",
            "multi": false
        },
        "ruleMetaValidation": {
            "required": true
        },
        "ruleObjectTypes": [
            "Bill"
        ],
    },
    {
        "name": "bill.bill.vendorId",
        "internal": "bill.vendorMap",
        "label": "Vendor",
        "dataType": "Map",
        "operators": [
            {
                "conditionOperator": "ContainsKey",
                "label": "Contains"
            },
            {
                "conditionOperator": "NotContainsKey",
                "label": "Not Contains"
            },
            {
                "conditionOperator": "MatchesAnyValue",
                "label": "Matches",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            },
            {
                "conditionOperator": "NotMatchesAnyValue",
                "label": "Not Matches",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            }
        ],
        "ruleMetaWidget": {
            "ruleMetaWidgetType": "MultiSelect",
            "multi": true,
            "ruleMetaWidgetRest": {
                "url": "/vendors/labels",
                "label": "label",
                "value": "id"
            }
        },
        "ruleMetaValidation": {
            "required": true
        },
        "ruleObjectTypes": [
            "Bill"
        ],
        "functions": []
    },
    {
        "name": "bill.bill.fromUserId",
        "internal": "bill.fromUserMap",
        "label": "Requestor",
        "dataType": "Map",
        "operators": [
            {
                "conditionOperator": "ContainsKey",
                "label": "Contains"
            },
            {
                "conditionOperator": "NotContainsKey",
                "label": "Not Contains"
            },
            {
                "conditionOperator": "MatchesAnyValue",
                "label": "Matches",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            },
            {
                "conditionOperator": "NotMatchesAnyValue",
                "label": "Not Matches",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            }
        ],
        "ruleMetaWidget": {
            "ruleMetaWidgetType": "MultiSelect",
            "multi": true,
            "ruleMetaWidgetRest": {
                "url": "/users/labels",
                "label": "label",
                "value": "id"
            }
        },
        "ruleMetaValidation": {
            "required": true
        },
        "ruleObjectTypes": [
            "Bill"
        ],
        "functions": []
    },
    {
        "name": "bill.bill.departmentId",
        "internal": "bill.departmentMap",
        "label": "Department",
        "dataType": "Map",
        "operators": [
            {
                "conditionOperator": "ContainsKey",
                "label": "Contains"
            },
            {
                "conditionOperator": "NotContainsKey",
                "label": "Not Contains"
            },
            {
                "conditionOperator": "MatchesAnyValue",
                "label": "Matches",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            },
            {
                "conditionOperator": "NotMatchesAnyValue",
                "label": "Not Matches",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            }
        ],
        "ruleMetaWidget": {
            "ruleMetaWidgetType": "MultiSelect",
            "multi": true,
            "ruleMetaWidgetRest": {
                "url": "/admin/departments/labels",
                "label": "label",
                "value": "id"
            }
        },
        "ruleMetaValidation": {
            "required": true
        },
        "ruleObjectTypes": [
            "Bill"
        ],
        "functions": []
    },
    {
        "name": "bill.bill.chartAccountId",
        "internal": "bill.chartOfAccountMap",
        "label": "GL categories",
        "dataType": "Map",
        "operators": [
            {
                "conditionOperator": "ContainsAllKeys",
                "label": "Contains All"
            },
            {
                "conditionOperator": "ContainsKey",
                "label": "Contains Any"
            },
            {
                "conditionOperator": "NotContainsAllKeys",
                "label": "Not Contains All"
            },
            {
                "conditionOperator": "NotContainsKey",
                "label": "Not Contains Any"
            },
            {
                "conditionOperator": "MatchesAllValues",
                "label": "Match All Values",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            },
            {
                "conditionOperator": "MatchesAnyValue",
                "label": "Match Any Value",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            },
            {
                "conditionOperator": "NotMatchesAllValues",
                "label": "Not Matches All Values",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            },
            {
                "conditionOperator": "NotMatchesAnyValue",
                "label": "Not Matches Any Value",
                "ruleMetaWidget": {
                    "ruleMetaWidgetType": "Text",
                    "multi": false
                }
            }
        ],
        "ruleMetaWidget": {
            "ruleMetaWidgetType": "MultiSelect",
            "multi": true,
            "ruleMetaWidgetRest": {
                "url": "/chart-of-accounts/labels",
                "label": "label",
                "value": "id"
            }
        },
        "ruleMetaValidation": {
            "required": true
        },
        "ruleObjectTypes": [
            "Bill"
        ],
        "functions": []
    },
]
`;

//write openai prompt to generated json based on user text and given schema
async function generateJson(userText, schema, ruleMetadata) {
  const prompt = `
    Generate a valid JSON based on the following text:
    ${userText}
    The final output should be json based on "interface Approval". User text will say a rule in english language that you have to convert to Approval json. Use following instructions for each field of Approval json written after = symbol:
    Hardcode these values:
    1. approval.ruleId = null
    2. approval.ruleOrder = 0.
    3. approval.approvalSteps = []

    Generate these values dynamically:
    1. approval.name = generate a short rule name on your own.
    2. approval.description = generate a rule description on your own.
    3. approval.objectType = is a number. infer it from rule metadata, if "bill" assign 2, if "PaymentOrder" assign 3.
    4. approval.expression = generate a rule expression based on user text and schema
    5. approval.expression.conditionGroups.conditions.field = it should correspond to the field name in rule metadata. For example, if user text says "bill amount greater than 1000", then field should be "bill.bill.amount"
    
    Use following schema information and rule metadata to generate json:
    This is schema """${schema}""".
    This is rule metadata to generate Condition """${ruleMetadata}""".
    `;

  const params = {
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    // top_p: 0.1,
  };
  const chatCompletion = await openai.chat.completions.create(params);

  // const gptResponse = await openai.completions({
  //     engine: 'davinci',
  //     prompt: prompt,
  //     maxTokens: 150,
  // });
  return chatCompletion;
}

async function createApprovalRule(approval) {
  // hardcode user for now
  approval.approvalSteps = [
    {
      approvalStepType: "Any",
      approvalEntities: [
        {
          userId: "e0f36b59-46df-477b-a457-c4452b2d43b3",
          onlyNotify: false,
        },
      ],
    },
  ];
  const api_url = "https://approval-service-5pt6lwesdq-uc.a.run.app/approvals";
  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": "dda21c8c-6a99-4faf-bbd4-02c2e47be460",
    "x-user-id": "e0f36b59-46df-477b-a457-c4452b2d43b3",
    "x-client": "chatbot-aw",
  };
  const response = await fetch(api_url, {
    method: "POST",
    body: JSON.stringify(approval),
    headers: {
      ...headers,
    },
  });
  return response.json();
}

function logWorkingOnIt() {
  console.log("working on it..");
}

const UI_CLIENT = "https://app.dev.rtzen.com";

async function processInput(userInput) {
  const intervalId = setInterval(logWorkingOnIt, 1000);
  const result = await generateJson(userInput, schemaInterface, ruleMetadata);
  console.log(JSON.stringify(result, null, 2));
  try {
    const approvalJsonStr = result.choices[0].message.content;

    //unescape json
    const approvalJson = JSON.parse(approvalJsonStr.replace(/\\n/g, ""));
    // console.log(approvalJson.approval);
    const approval = await createApprovalRule(approvalJson.approval);
    // console.log(approval);
    console.log(
      `There you go: ${UI_CLIENT}/setup/approval-rules/${approval.id}`
    );
    return `${UI_CLIENT}/setup/approval-rules/${approval.id}`;
  } catch (e) {
    console.error(e);
  } finally {
    clearInterval(intervalId);
  }
}

export = {
  processInput: processInput,
};
