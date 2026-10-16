import { redirect } from 'next/navigation';

export default function StudioRedirectPage() {
  redirect('/?view=studio');
}
