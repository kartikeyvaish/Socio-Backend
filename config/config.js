const Configuration = {
  Port: process.env.PORT || 3000,
  db_url: `mongodb://${process.env.host}:${process.env.DB_PORT}/${process.env.DB_Name}`,
  db_config: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

module.exports = Configuration;
