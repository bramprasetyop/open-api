module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_employee', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.DataTypes.INTEGER,
        unique: true,
        allowNull: false,
      },
      employee_name: {
        type: Sequelize.DataTypes.STRING(50),
        allowNull: false,
      },
      employee_manager_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('tbl_employee');
  },
};
