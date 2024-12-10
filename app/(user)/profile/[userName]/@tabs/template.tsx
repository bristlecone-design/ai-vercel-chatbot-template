/**
 * A template file is similar to a layout in that it wraps a layout or page. Unlike layouts that persist across routes and maintain state, templates are given a unique key, meaning children Client Components reset their state on navigation.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/template
 */

export default function Template(props: { children: React.ReactNode }) {
  return props.children;
}
