export const convertArrayToPostgresString = (array?: string[]) =>
  array ? `{${array.join(',')}}` : null;

export const isTemplateStringsArray = (
  strings: unknown
): strings is TemplateStringsArray => {
  return (
    Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw)
  );
};
