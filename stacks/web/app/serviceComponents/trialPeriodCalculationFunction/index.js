exports.handler = (event, context, callback) => {

  const trialPeriodStatuses = {
      "Available" : "AVAILABLE",
      "Active" : "ACTIVE",
      "Expired" : "EXPIRED",
      "Future" : "FUTURE"
  }

  var trialPeriodTimestamp = null;
  var trialPeriodStatus = trialPeriodStatuses.Inactive

  if (event.trialPeriodTimestamp === null) {
    trialPeriodStatus = trialPeriodStatuses.Available

  // trial period is in the future
  } else if (
    Number((event.trialPeriodTimestamp) * 1000) > Math.floor(new Date().getTime())
  ) {
    trialPeriodTimestamp = event.trialPeriodTimestamp;
    trialPeriodStatus = trialPeriodStatuses.Future

  //trial period has expired
  } else if ((Number(event.trialPeriodTimestamp) * 1000) + (event.trialPeriodDays * 86400) * 1000 < Math.floor(new Date().getTime())) {
    trialPeriodTimestamp = event.trialPeriodTimestamp;
    trialPeriodStatus = trialPeriodStatuses.Expired

  //trial period is currently active
  } else {
    trialPeriodTimestamp = event.trialPeriodTimestamp;
    trialPeriodStatus = trialPeriodStatuses.Active
  }

  event.trialPeriodTimestamp = trialPeriodTimestamp;
  event.trialPeriodStatus = trialPeriodStatus
  return callback(null, event);
};
