import { FaRegEdit } from 'react-icons/fa';

import PathLoaderButton from '@/components/primitives/PathLoaderButton';

export default function EditButton({ path }: { path: string }) {
  return (
    <PathLoaderButton
      path={path}
      icon={<FaRegEdit size={15} className="translate-y-[0.5px]" />}
    >
      Edit
    </PathLoaderButton>
  );
}
