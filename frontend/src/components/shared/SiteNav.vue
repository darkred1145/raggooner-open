<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '../../composables/useAuth';
import { useUserRoles } from '../../composables/useUserRoles';

const route = useRoute();
const { linkedPlayer } = useAuth();
const { can } = useUserRoles();

const baseNav = [
    { to: '/',          icon: 'ph-fill ph-flag-checkered', label: 'Play',      sub: 'Tournaments' },
    { to: '/analytics', icon: 'ph-fill ph-chart-line-up',  label: 'Analytics', sub: 'Global Stats' },
    { to: '/tools',     icon: 'ph-fill ph-wrench',          label: 'Tools',     sub: 'Rollers' },
];

const profileNav = { to: '/profile', icon: 'ph-fill ph-user-circle', label: 'Profile', sub: 'My Account' };
const settingsNav = { to: '/settings', icon: 'ph-fill ph-sliders', label: 'Settings', sub: 'Defaults' };
const adminNav = { to: '/admin/users', icon: 'ph-fill ph-shield-check', label: 'Admin', sub: 'User Roles' };

const nav = computed(() => {
    const items = [...baseNav];
    if (linkedPlayer.value) items.push(profileNav);
    if (can('create_official_tournament')) items.push(settingsNav);
    if (can('manage_users')) items.push(adminNav);
    return items;
});

function isActive(to: string) {
    if (to === '/') return route.path === '/';
    return route.path.startsWith(to);
}
</script>

<template>
    <div class="max-w-3xl mx-auto flex flex-wrap gap-2 mt-4 mb-12 border-b border-cyber-border/50 pb-12 animate-fade-in">

        <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="group relative flex-1 basis-12 rounded-xl p-2 md:p-4 flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-300 border overflow-hidden"
            :class="isActive(item.to)
                ? 'bg-cyber-panel border-cyber-glow/40 shadow-neon-cyan cursor-default pointer-events-none'
                : 'bg-cyber-dark border-cyber-border hover:border-cyber-glow/30 hover:bg-cyber-panel cursor-pointer hover:shadow-[0_0_15px_rgba(0,240,255,0.08)]'"
        >
            <i :class="[item.icon, 'text-2xl', isActive(item.to) ? 'text-cyber-glow' : 'text-cyber-glow/60 group-hover:text-cyber-glow']"></i>
            <div class="hidden md:block">
                <div class="text-sm font-bold uppercase tracking-widest"
                     :class="isActive(item.to) ? 'text-white' : 'text-white group-hover:text-cyber-glow/90'">
                    {{ item.label }}
                </div>
                <div class="text-[10px]"
                     :class="isActive(item.to) ? 'text-cyber-glow/60' : 'text-slate-500 group-hover:text-slate-400'">
                    {{ item.sub }}
                </div>
            </div>
        </router-link>
    </div>
</template>
