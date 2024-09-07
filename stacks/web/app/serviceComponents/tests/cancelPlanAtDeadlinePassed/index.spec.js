const handler = require('../../checkCancelDeadlinePassedFunction/index')

function callback(err, data) { 
  if (err) {
    return err; 
  }
  return data
}
  
describe('test checkCancelDeadlinePassed', () => {

    test('check cancelPlanAt deadline passed', async () => {
      let now = new Date().getTime()
      let simulateOneWeekInFutureInPast = now - (86400000 * 7)
      const event = {
          timestamp: Math.floor(simulateOneWeekInFutureInPast / 1000),
      }

      const response = await handler.handler(event, null, callback)

      expect(response).toBeTruthy()
    })

    test('check cancelPlanAt deadline has not passed', async () => {

      let now = new Date().getTime()
      let simulateOneWeekInFuture = now + (86400000 * 7)
      const event = {
          timestamp: Math.floor(simulateOneWeekInFuture / 1000),
      }

      const response = await handler.handler(event, null, callback)
      expect(response).toBeFalsy()
  })
})
