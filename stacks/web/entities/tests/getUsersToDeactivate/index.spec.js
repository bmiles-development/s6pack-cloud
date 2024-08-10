const handler = require('../../filterUsersToDeactivateFunction/index')

function callback(err, data) { 
  if (err) {
    return err; 
  }
  return data
}
  
describe('test', () => {

    test('deactivate users', async () => {

        const event = {
            activeUsersVsNewPlanDifference: "2",
            currentUserId: "36809e0b-ea25-407f-8286-3484f021905e",
            users: [
                {
                "Enabled": true,
                "Username": "36809e0b-ea25-407f-8286-3484f021905e"
                },
                {
                "Enabled": true,
                "Username": "7c382405-ada2-430e-87ab-2f42d6ccff88"
                },
                {
                "Enabled": true,
                "Username": "4e2a7ae7-101c-48a0-b618-c46a8d0ed40e"
                },
                {
                "Enabled": true,
                "Username": "b1ab9daf-e796-445e-8ab9-f30cd9456182"
                }
            ]
        }

        const response = await handler.handler(event, null, callback)
        expect(response.body).toHaveLength(2)
    })
})
