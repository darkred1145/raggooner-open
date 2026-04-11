import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import HomeView from '../views/HomeView.vue'
import AuthCallback from '../views/AuthCallback.vue'
import { useUserRoles } from '../composables/useUserRoles'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/auth/callback',
            name: 'auth-callback',
            component: AuthCallback
        },
        {
            path: '/t/:id',
            name: 'tournament',
            component: () => import('../views/TournamentView.vue')
        },
        {
            path: '/analytics',
            name: 'analytics',
            component: () => import('../components/AnalyticsDashboard.vue')
        },
        {
            path: '/tools',
            name: 'tools',
            component: () => import('../views/ToolsView.vue')
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('../views/ProfileView.vue')
        },
        {
            path: '/admin/users',
            name: 'admin-users',
            component: () => import('../views/AdminUsersView.vue'),
            beforeEnter: async (_to, _from, next) => {
                const { can, roleLoading } = useUserRoles();
                if (roleLoading.value) {
                    await new Promise<void>(resolve => {
                        const stop = watch(roleLoading, loading => {
                            if (!loading) { stop(); resolve(); }
                        });
                    });
                }
                can('manage_users') ? next() : next('/');
            }
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('../views/GlobalSettingsView.vue'),
            beforeEnter: async (_to, _from, next) => {
                const { can, roleLoading } = useUserRoles();
                if (roleLoading.value) {
                    await new Promise<void>(resolve => {
                        const stop = watch(roleLoading, loading => {
                            if (!loading) { stop(); resolve(); }
                        });
                    });
                }
                can('create_official_tournament') ? next() : next('/');
            }
        }
    ]
})

export default router