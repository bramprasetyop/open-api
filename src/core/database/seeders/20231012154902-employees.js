/* eslint-disable @typescript-eslint/no-var-requires */
const uuid = require('uuid'); // Import the uuid library

module.exports = {
  up: async (queryInterface) => {
    const data = [
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 1, // Numeric value for 'employee_id'
        employee_name: 'Mary',
        employee_manager_id: null,
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 2, // Numeric value for 'employee_id'
        employee_name: 'Fred',
        employee_manager_id: 1, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 3, // Numeric value for 'employee_id'
        employee_name: 'Mary',
        employee_manager_id: 2, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 4, // Numeric value for 'employee_id'
        employee_name: 'Vilo',
        employee_manager_id: 3, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 5, // Numeric value for 'employee_id'
        employee_name: 'Mora',
        employee_manager_id: 2, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 6, // Numeric value for 'employee_id'
        employee_name: 'Bill',
        employee_manager_id: 5, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 7, // Numeric value for 'employee_id'
        employee_name: 'John',
        employee_manager_id: 6, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 8, // Numeric value for 'employee_id'
        employee_name: 'George',
        employee_manager_id: 1, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 9, // Numeric value for 'employee_id'
        employee_name: 'Chilla',
        employee_manager_id: 8, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 10, // Numeric value for 'employee_id'
        employee_name: 'Moya',
        employee_manager_id: 8, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 11, // Numeric value for 'employee_id'
        employee_name: 'Silvy',
        employee_manager_id: 1, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 12, // Numeric value for 'employee_id'
        employee_name: 'Hans',
        employee_manager_id: 11, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 13, // Numeric value for 'employee_id'
        employee_name: 'Michael',
        employee_manager_id: 11, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: uuid.v4(), // Generate a UUID for the 'id' field
        employee_id: 14, // Numeric value for 'employee_id'
        employee_name: 'Richard',
        employee_manager_id: 11, // Numeric value for 'employee_manager_id'
        created_at: new Date(),
        updated_at: null,
      },
    ];

    // Insert the data into the table
    await queryInterface.bulkInsert('tbl_employee', data, {});
  },

  down: async (queryInterface) => {
    // Implement the logic to remove the data from the table (if needed)
    await queryInterface.bulkDelete('tbl_employee', null, {});
  },
};
