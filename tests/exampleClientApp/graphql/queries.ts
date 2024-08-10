export const getUpcomingInvoice = /* GraphQL */ `
    query getUpcomingInvoice {
        getUpcomingInvoice {
            oldPlanTotal
            nextInvoiceTimestamp
        }
    }`
;

export const listUsers = /* GraphQL */ `
    query listUsers {
        listUsers {
            email
            enabled
            id
            group
            groupModfified
            created
            modified
            status
        }
    }
`;

export const getUser = /* GraphQL */ `
    query getUser($username: String) {
        getUser {
            email
            enabled
            id
            group
            groupModfified
            created
            modified
            status
        }
    }
`;

export const listCharges = /* GraphQL */ `
    query listCharges($input: ListChargesInput, $limit: Int) {
        listCharges(input: $input, limit: $limit) {
            id
            created
            amount
            paid
            paymentType
            last4
            refunded
            refundedAmount
            failureMessage
        }
    }
`;

export const getTenant = /* GraphQL */ `
    query getTenant {
        getTenant {
            id
        }
    }
`;

export const getCurrentAndAllPlans = /* GraphQL */ `
    query getCurrentAndAllPlans {
        listPlans {
            id
            title
            price
            statementDescriptor
            featureList
            totalUsers
        }
        getTenant {
            id
            planId
            trialPeriodDays
            trialPeriodTimestamp
            plan {
                price
                statementDescriptor
                featureList
                totalUsers
            }
        }
    }
`;

export const getTenantTrialPeriod = /* GraphQL */ `
    query getTenantTrialPeriod {
        getTenantTrialPeriod {
            trialPeriodTimestamp
	        trialPeriodStatus
        }
    }
`;

export const listPlans = /* GraphQL */ `
    query listPlans {
        listPlans {
            id
            title
            price
            statementDescriptor
            featureList
            totalUsers
        }
    }
`;

export const checkout = /* GraphQL */ `
    query checkout($planId: String!) {
        checkout(planId: $planId) {
            nextInviceSubTotal
            newPlanTotal
            oldPlanTotal
            newPlanTotalRemaining
            oldPlanTotalUnused
            nextInvoiceTimestamp
            previousInvoiceTimestamp
        }
    }
`;

export const listPaymentMethods = /* GraphQL */ `
    query listPaymentMethods {
        listPaymentMethods {
            id
            paymentType
            expirationDate
            last4
            cardType
            default
        }
    }
`;