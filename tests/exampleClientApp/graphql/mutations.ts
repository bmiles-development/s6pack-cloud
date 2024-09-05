export const addAdminUser = /* GraphQL */ `
    mutation AddAdminUser($username: AWSEmail!) {
        addAdminUser(username: $username) {
            id
            email
            enabled
            group
            created
            modified
        }
    }
`;

export const addStandardUser = /* GraphQL */ `
    mutation AddStandardUser($username: AWSEmail!) {
        addStandardUser(username: $username) {
            id
            email
            enabled
            group
            created
            modified
        }
    }
`;

export const deleteStandardUser = /* GraphQL */ `
    mutation DeleteStandardUser($id: String!) {
        deleteStandardUser(id: $id) {
            id
        }
    }
`;

export const deleteAdminUser = /* GraphQL */ `
    mutation DeleteStandardUser($id: String!) {
        deleteAdminUser(id: $id) {
            id
        }
    }
`;

export const changeAdminToStandardUser = /* GraphQL */ `
    mutation ChangeAdminToStandardUser($id: String!) {
        changeAdminToStandardUser(id: $id) {
            id
        }
    }
`;

export const changeStandardUserToAdmin = /* GraphQL */ `
    mutation ChangeStandardUserToAdmin($id: String!) {
        changeStandardUserToAdmin(id: $id) {
            id
        }
    }
`;

export const activateUser = /* GraphQL */ `
    mutation ActivteUser($id: String!) {
        activateUser(id: $id) {
            id
            enabled
        }
    }
`;

export const deactivateUser = /* GraphQL */ `
    mutation DeactivateUser($id: String!) {
        deactivateUser(id: $id) {
            id
            enabled
        }
    }
`;


export const enableDeleteAccount = /* GraphQL */ `
    mutation EnableDeleteAccount {
        enableDeleteAccount{
            id,
            deleteAccountFlag
        }
    }
`;

export const disableDeleteAccount = /* GraphQL */ `
    mutation DisableDeleteAccount {
        disableDeleteAccount{
            id,
            deleteAccountFlag
        }
    }
`;

export const deleteAccount = /* GraphQL */ `
    mutation DeleteAccount {
        deleteAccount{
            success
        }
    }
`;

export const confirmAddPlan = /* GraphQL */ `
    mutation confirmAddPlan($paymentMethodId: String!, $planId: String!, $setupIntentClientSecret:String!) {
        confirmAddPlan(paymentMethodId: $paymentMethodId, planId: $planId, setupIntentClientSecret: $setupIntentClientSecret) {
            id
            planId
            plan {
                id
                title
                price
                statementDescriptor
                featureList
                totalUsers
            }
        }
    }
`;

export const confirmAddPaymentMethod = /* GraphQL */ `
    mutation confirmAddPaymentMethod($paymentMethodId: String!, $setupIntentClientSecret:String!) {
        confirmAddPaymentMethod(paymentMethodId: $paymentMethodId, setupIntentClientSecret: $setupIntentClientSecret) {
            id
            paymentType
            expirationDate
            last4
            cardType
            default
        }
    }
`;

export const changePlan = /* GraphQL */ `
    mutation changePlan($planId: String!) {
        changePlan(planId: $planId) {
            id
            planId
            cancelPlanAt
            plan {
                id
                title
                price
                statementDescriptor
                featureList
                totalUsers
            }
            users {
                id
                enabled
            }
        }
    }
`;

export const createPlanIntent = /* GraphQL */ `
    mutation createPlanIntent($planId: String!) {
        createPlanIntent(planId: $planId) {
            planId
            clientSecret
        }
    }
`;

export const createPaymentMethodIntent = /* GraphQL */ `
    mutation createPaymentMethodIntent {
        createPaymentMethodIntent {
            planId
            clientSecret
        }
    }
`;

export const contactUs = /* GraphQL */ `
    mutation contactUs($input: ContactUsInput!) {
        contactUs(input: $input) {
            messageType
            message
        }
    }
`;

export const cancelPaidPlan = /* GraphQL */ `
    mutation cancelPaidPlan{
        cancelPaidPlan {
            id
        }
    }
`;

export const cancelPaidPlanAtPeriodEnd = /* GraphQL */ `
    mutation cancelPaidPlanAtPeriodEnd{
        cancelPaidPlanAtPeriodEnd {
            id
            cancelPlanAt
        }
    }
`;


export const reactivateCancelingPaidPlan = /* GraphQL */ `
    mutation reactivateCancelingPaidPlan{
        reactivateCancelingPaidPlan {
            id
        }
    }
`;

export const setDefaultPaymentMethod = /* GraphQL */ `
    mutation setDefaultPaymentMethod($paymentMethodId: String!) {
        setDefaultPaymentMethod(paymentMethodId: $paymentMethodId) {
            id
            paymentType
            expirationDate
            last4
            cardType
            default
        }
    }
`;

export const deletePaymentMethod = /* GraphQL */ `
    mutation deletePaymentMethod($paymentMethodId: String!) {
        deletePaymentMethod(paymentMethodId: $paymentMethodId) {
            id
        }
    }
`;
