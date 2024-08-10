exports.handler = async function (event, context, callback) {
    let activeUsersVsNewPlanDifference = event.activeUsersVsNewPlanDifference
    let currentUserId = event.currentUserId
    let users = event.users
    let usersToDisable = []

    disabledUserCount=0;
    i=0;
    while(disabledUserCount < activeUsersVsNewPlanDifference){
        if(users[i].Enabled == true && currentUserId != users[i].Username){
            usersToDisable.push({
                Username: users[i].Username,
                Enabled: users[i].Enabled
            })
            disabledUserCount++
        }
        i++
    }

    return {
        statusCode: 200,
        body: usersToDisable
      };
};
