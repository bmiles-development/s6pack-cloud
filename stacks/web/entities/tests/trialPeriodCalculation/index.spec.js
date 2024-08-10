const handler = require('../../trialPeriodCalculationFunction/index')

const trialPeriodDays = 14

function callback(err, data) { 
  if (err) {
    return err; 
  }
  return data
}
  
describe('trial Period Calculation Simulations', () => {

  test('trial period is active - One Day Ago', async () => {
    let now = Math.floor(new Date().getTime())
    let simulateOneDayAgo = now - 86400000

    const event = {
      trialPeriodTimestamp: String(simulateOneDayAgo / 1000),
      trialPeriodDays : trialPeriodDays
    };

    const response = await handler.handler(event, null, callback);
    expect(response.trialPeriodStatus).toEqual("ACTIVE");
  });


  test('trial period is active - One Day Ago', async () => {
    let now = Math.floor(new Date().getTime())
    let simulateOneDayAgo = now - 86400000

    const event = {
      trialPeriodTimestamp: String(simulateOneDayAgo / 1000),
      trialPeriodDays : trialPeriodDays
    };

    const response = await handler.handler(event, null, callback);
    expect(response.trialPeriodStatus).toEqual("ACTIVE");
  });

  test('trial period expired - trialPeriodDays Plus One Day Ago', async () => {
  
    let now = Math.floor(new Date().getTime())
    let simulateTrialPeriodDaysPlusOneDayAgo = now - (trialPeriodDays * 86400000) - 86400000

    const event = {
      trialPeriodTimestamp: String(simulateTrialPeriodDaysPlusOneDayAgo / 1000),
      trialPeriodDays : trialPeriodDays
    };

    const response = await handler.handler(event, null, callback);
    expect(response.trialPeriodStatus).toEqual("EXPIRED");
  });

  test('no trial yet', async () => {
  
    let now = Math.floor(new Date().getTime())
  
    const event = {
      trialPeriodTimestamp: null,
      trialPeriodDays : trialPeriodDays
    };

    const response = await handler.handler(event, null, callback);
    expect(response.trialPeriodStatus).toEqual("AVAILABLE");
  });

  test('trial period in future', async () => {
  
    let now = Math.floor(new Date().getTime())
    let simulateTrialPeriodDaysFuture = now + (trialPeriodDays * 86400000) - 86400000

    const event = {
      trialPeriodTimestamp: String(simulateTrialPeriodDaysFuture / 1000),
      trialPeriodDays : trialPeriodDays
    };

    const response = await handler.handler(event, null, callback);
    expect(response.trialPeriodStatus).toEqual("FUTURE");
  });

});