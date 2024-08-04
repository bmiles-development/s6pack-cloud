exports.handler = async function (event, context, callback) {
  let dbPlanList = event.dbPlanList;
  let processorPlanId = event.processorPlanId;

  i = 0;
  while (i < dbPlanList.length) {
    console.log(dbPlanList[i].ProcessorPlanId.S == processorPlanId);
    if (dbPlanList[i].ProcessorPlanId.S == processorPlanId) {
      console.log("returning");
      return {
        Plan: dbPlanList[i],
      };
    }
    console.log(i)
    i++;
  }

  return {
    statusCode: 400,
    body: "Plan not found.",
  };
};
