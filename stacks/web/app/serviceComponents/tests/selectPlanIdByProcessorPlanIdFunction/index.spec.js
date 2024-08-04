const handler = require("../../selectPlanIdByProcessorPlanIdFunction/index");

function callback(err, data) {
  if (err) {
    return err;
  }
  return data;
}

const dbPlanList = [
  {
    Id: { S : "one"},
    ProcessorPlanId: { S : "prod_1"},
  },
  {
    Id: { S : "two"},
    ProcessorPlanId: { S : "prod_3"},
  },
  {
    Id: { S : "three"},
    ProcessorPlanId: { S : "prod_3"},
  },
  {
    Id: { S : "four"},
    ProcessorPlanId: { S : "prod_4"},
  },
];

describe("test processorPlanId Search", () => {
  test("prod4", async () => {
    const event = {
      processorPlanId: "prod_4",
      dbPlanList: dbPlanList
    };

    const response = await handler.handler(event, null, callback);
    expect(response.Plan.Id.S).toEqual("four");
  });

  test("prod1", async () => {
    const event = {
      processorPlanId: "prod_1",
      dbPlanList: dbPlanList
    };

    const response = await handler.handler(event, null, callback);
    expect(response.Plan.Id.S).toEqual("one");
  });

  test("fail prodx", async () => {
    const event = {
      processorPlanId: "prodx",
      dbPlanList: dbPlanList
    };

    const response = await handler.handler(event, null, callback);
    expect(response.statusCode).toEqual(400);
  });
});
