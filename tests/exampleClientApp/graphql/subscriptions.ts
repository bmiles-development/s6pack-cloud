export const planModified = /* GraphQL */ `
    subscription planModified($id: String!) {
        planModified(id: $id) {
            id
        }
    }
`;

export const planCanceled = /* GraphQL */ `
    subscription planCanceled($id: String!) {
        planCanceled(id: $id) {
            id
        }
    }
`;

export const accountDeleted = /* GraphQL */ `
    subscription accountDeleted($id: String!) {
        accountDeleted(id: $id) {
            id
        }
    }
`;

