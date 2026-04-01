from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),
    path('jobs/', views.jobs_page, name='jobs_page'),
    path('jobs/<str:job_id>/', views.job_detail_page, name='job_detail_page'),
    path('login/', views.login_page, name='login_page'),
    path('register/', views.register_page, name='register_page'),
    path('dashboard/', views.dashboard_page, name='dashboard_page'),

    path('api/jobs/', views.api_jobs, name='api_jobs'),
    path('api/jobs/<str:job_id>/', views.api_job_detail, name='api_job_detail'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/register/', views.api_register, name='api_register'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/me/', views.api_me, name='api_me'),
]
