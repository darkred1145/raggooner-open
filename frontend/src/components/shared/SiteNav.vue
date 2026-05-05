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
    <div class="max-w-3xl mx-auto flex flex-wrap gap-2 mt-4 mb-12 border-b border-cyber-border/40 pb-12 animate-fade-in">

        <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="group flex-1 basis-12 rounded-lg p-2 md:p-4 flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 transition-all duration-200 border"
            :class="isActive(item.to)
                ? 'bg-cyber-panel border-cyber-glow/30 cursor-default pointer-events-none'
                : 'bg-cyber-dark border-transparent hover:border-cyber-border hover:bg-cyber-panel cursor-pointer'"
        >
            <i :class="[item.icon, 'text-2xl', isActive(item.to) ? 'text-cyber-glow' : 'text-slate-400 group-hover:text-cyber-glow/80']"></i>
            <div class="hidden md:block">
                <div class="text-sm font-semibold uppercase tracking-wide"
                     :class="isActive(item.to) ? 'text-white' : 'text-slate-300 group-hover:text-white'">
                    {{ item.label }}
                </div>
                <div class="text-[10px]"
                     :class="isActive(item.to) ? 'text-cyber-glow/50' : 'text-slate-500'">
                    {{ item.sub }}
                </div>
            </div>
        </router-link>
    </div>
</template>
