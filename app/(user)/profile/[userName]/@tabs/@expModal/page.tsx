import type { ProfilePageProps } from '../../_shared/profile-page-types';

export default async function SingleExperienceInterceptorPage(
  props: ProfilePageProps
) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { children } = props;

  // console.log(`**** props in single experience interceptor page`, {
  //   params,
  //   searchParams,
  //   children,
  // });

  return null;
}
