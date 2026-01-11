import { redirect } from 'next/navigation';

export default function ExecomHierarchyRedirect() {
    // Redirect to the new unified students page with hierarchy tab
    redirect('/execom/students?tab=hierarchy');
}
