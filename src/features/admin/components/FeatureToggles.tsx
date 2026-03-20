import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { motion } from 'framer-motion';

const FeatureToggles = () => {
    const [features, setFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeatures();
    }, []);

    const loadFeatures = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getFeatures();
            setFeatures(data);
        } catch {
            // handle err
        }
        setLoading(false);
    };

    const toggleFeature = async (key: string, enabled: boolean) => {
        // optimistic update
        setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
        await adminApi.updateFeature(key, enabled);
    };

    if (loading) return <div className="p-4 text-gray-500">Loading Features...</div>;

    return (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="card-dark p-6">
            <h3 className="card-title mb-6">Global Feature Toggles (Pro-Level)</h3>
            <div className="flex flex-col gap-4">
                {features.map(f => (
                    <div key={f.key} className="flex items-center justify-between p-4 border border-white/[0.05] rounded-xl bg-white/[0.01]">
                        <div>
                            <div className="font-semibold text-[#EAEAEA] mb-1">{f.name}</div>
                            <div className="text-sm text-gray-500">{f.description}</div>
                        </div>
                        <button
                            onClick={() => toggleFeature(f.key, !f.enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.enabled ? 'bg-[#D4AF37]' : 'bg-gray-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default FeatureToggles;
