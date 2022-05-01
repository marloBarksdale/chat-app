export const generateMessage = (username, message) => {
  return { username, text: message, createdAt: new Date().getTime() };
};
