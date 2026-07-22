<?php

namespace App\Support\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Teacher = 'teacher';
    case Parent = 'parent';
    case Guard = 'guard';
}
