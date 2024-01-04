module.exports = {
  up: async (queryInterface) => {
    const data = [
      {
        id: '8a51435e-9263-44b6-9c2e-dcd16de4ce58',
        email: 'bram@gmail.com',
        password:
          '$2b$10$dzud6KK6FnRYmf199spyQeHQgItSBrmIkuqmE.BmFY2kileoO2DYC',
        created_at: new Date('2023-10-12 13:08:23.617'),
        updated_at: new Date('2023-10-12 13:08:23.617'),
      },
    ];

    // Insert the data into the table
    await queryInterface.bulkInsert('tbl_user', data, {});
  },

  down: async () => {
    // Implement the logic to remove the data from the table (if needed)
  },
};
