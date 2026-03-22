import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { SUPERADMIN_UIDS } from '../utils/constants'
import { auth } from '../firebase'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
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
            beforeEnter: (_to, _from, next) => {
                const uid = auth.currentUser?.uid;
                if (uid && SUPERADMIN_UIDS.includes(uid)) {
                    next();
                } else {
                    next('/');
                }
            }
        }
    ]
})

export default router