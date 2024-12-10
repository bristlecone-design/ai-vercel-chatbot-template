import type { ProfilePageProps } from '../../../../_shared/profile-page-types';

export default async function SingleExperienceInterceptorDynamicDefault(
  props: ProfilePageProps
) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { children } = props;

  // console.log(
  //   `**** props in single experience interceptor dynamic default page`,
  //   {
  //     params,
  //     searchParams,
  //     children,
  //   }
  // );

  // @see https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#modals
  return null;
}
