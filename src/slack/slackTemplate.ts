function billApprovalTemplate({ submittedBy, bill }) {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Bill Approval",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Submitted By:*\n${submittedBy}`,
          },
          {
            type: "mrkdwn",
            text: `*Bill Total:*\n${bill.billTotal}`,
          },
        ],
      },
      {
        type: "actions",
        block_id: "actions1",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Approve",
            },
            value: "approve",
            action_id: "button_1",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Reject",
            },
            value: "reject",
            action_id: "button_2",
          },
        ],
      },
    ],
  };
}

export = {
  billApprovalTemplate: billApprovalTemplate,
};
