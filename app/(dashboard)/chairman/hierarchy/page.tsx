import { redirect } from 'next/navigation';

export default function ChairmanHierarchyRedirect() {
    // Redirect to the new unified students page with hierarchy tab
    redirect('/chairman/students?tab=hierarchy');
}
