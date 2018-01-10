const validPassword = password => {
  return password.length > 7 && password.length < 51;
};

export { validPassword };
