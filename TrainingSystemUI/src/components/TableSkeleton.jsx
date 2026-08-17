export default function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="table-modern table-skeleton fade-in">
            <table className="table-modern">
                <thead>
                    <tr>
                        {Array.from({ length: columns }, (_, i) => (
                            <th key={i}><span className="skel skel-th" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }, (_, r) => (
                        <tr key={r}>
                            {Array.from({ length: columns }, (_, c) => (
                                <td key={c}>
                                    <span
                                        className="skel skel-td"
                                        style={{ width: c === 0 ? "70%" : `${40 + Math.random() * 40}%` }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
