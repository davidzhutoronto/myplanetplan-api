export const checkIsUUID = (...ids) => {
  let isUuid = true;
  for (const id of ids) {
    if (!id) {
      return false;
    }
    // regex found at https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
    // Modified to also accept non caps so it also accepts data from postgres.
    isUuid = id.match(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89AB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i
    );
  }
  return isUuid;
};

export const cleanString = (input) => {
  input += ''; // Needed to parse input as string.
  return input.replace(/[|&;$%@"<>()+,]/g, '');
};
